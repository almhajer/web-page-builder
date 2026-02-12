import * as vscode from 'vscode';
import { VIEW_TYPES, MESSAGE_TYPES, TIMEOUTS } from '../constants';
import { EditorInfo, WebviewMessage } from '../types';

/**
 * خدمة إدارة المحرر (Editor)
 * مسؤول عن إنشاء وعرض لوحة المحرر وإدارة التواصل معها
 */
export class EditorService {
    private panel: vscode.WebviewPanel | null = null;
    private pendingCodeRequest: { requestId: string; resolver: (code: string) => void } | null = null;

    constructor(private readonly extensionUri: vscode.Uri) {}

    /**
     * إنشاء وعرض لوحة المحرر
     */
    public createPanel(): void {
        this.panel = vscode.window.createWebviewPanel(
            VIEW_TYPES.EDITOR,
            'Editor',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this.extensionUri]
            }
        );

        this.panel.webview.html = this.getWebviewContent();

        // إعداد معالج الرسائل
        this.panel.webview.onDidReceiveMessage(
            this.handleMessage.bind(this),
            undefined
        );

        // إعداد معالج إغلاق اللوحة
        this.panel.onDidDispose(() => {
            this.panel = null;
            console.log('Editor panel was closed');
        });
    }

    /**
     * الحصول على معلومات المحرر
     */
    public getInfo(): EditorInfo {
        return {
            panel: this.panel,
            isReady: this.panel !== null
        };
    }

    /**
     * إظهار لوحة المحرر
     */
    public reveal(): void {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
        }
    }

    /**
     * طلب الكود الحالي من المحرر
     */
    public async requestCurrentCode(): Promise<string> {
        if (!this.panel) {
            throw new Error('Editor panel is not open');
        }

        // إظهار اللوحة والتأكد من جاهزيتها
        this.reveal();
        await this.delay(TIMEOUTS.WEBVIEW_READY);

        // إنشاء requestId فريد
        const requestId = Date.now().toString();

        // إنشاء Promise للحصول على الكود
        return new Promise<string>((resolve, reject) => {
            // تعيين timeout
            const timeout = setTimeout(() => {
                this.pendingCodeRequest = null;
                reject(new Error('فشل استلام الكود من المحرر (انتهت المهلة الزمنية)'));
            }, TIMEOUTS.CODE_REQUEST);

            // تعيين pending request
            this.pendingCodeRequest = {
                requestId: requestId,
                resolver: (code: string) => {
                    clearTimeout(timeout);
                    resolve(code);
                }
            };

            // إرسال الطلب
            try {
                // التحقق من أن اللوحة لا تزال مفتوحة بعد await
                if (!this.panel) {
                    throw new Error('Editor panel was closed while waiting');
                }
                this.panel.webview.postMessage({
                    type: MESSAGE_TYPES.REQUEST_CURRENT_CODE,
                    requestId: requestId
                });
                console.log('Sent requestCurrentCode to EditorPanel');
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    /**
     * إرسال كود إلى المحرر
     */
    public sendCode(code: string): void {
        if (this.panel) {
            this.panel.webview.postMessage({
                type: MESSAGE_TYPES.UPDATE_EDITOR_VALUE,
                code: code
            });
        }
    }

    /**
     * التحقق من وجود اللوحة
     */
    public isPanelOpen(): boolean {
        return this.panel !== null;
    }

    /**
     * معالج الرسائل من الـ webview
     */
    private handleMessage(message: WebviewMessage): void {
        console.log('EditorService received message:', message);

        switch (message.type) {
            case MESSAGE_TYPES.UPDATE_CODE:
                // التحقق من وجود طلب معلق
                if (this.pendingCodeRequest && message.requestId === this.pendingCodeRequest.requestId) {
                    const { resolver } = this.pendingCodeRequest;
                    this.pendingCodeRequest = null;
                    if (message.code) {
                        resolver(message.code);
                    }
                }
                break;
        }
    }

    /**
     * الحصول على محتوى HTML للـ webview
     */
    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editor</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs/loader.min.js"></script>
    <style>
        body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background-color: #1e1e1e; }
        #container { height: 100vh; width: 100%; }
    </style>
</head>
<body>
    <div id="container"></div>
    <script>
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs' }});
        require(['vs/editor/editor.main'], function() {
            const vscode = acquireVsCodeApi();
            let editor = null;

            window.addEventListener('message', event => {
                const message = event.data;
                console.log('Webview received message:', message);
                console.log('Editor exists:', editor !== null);

                switch (message.type) {
                    case '${MESSAGE_TYPES.UPDATE_EDITOR_VALUE}':
                        if (editor) {
                            editor.setValue(message.code);
                        }
                        break;
                    case '${MESSAGE_TYPES.REQUEST_CURRENT_CODE}':
                        if (editor) {
                            const code = editor.getValue();
                            console.log('Sending code to extension, length:', code.length);
                            vscode.postMessage({
                                type: '${MESSAGE_TYPES.UPDATE_CODE}',
                                code: code,
                                requestId: message.requestId
                            });
                        }
                        break;
                }
            });

            editor = monaco.editor.create(document.getElementById('container'), {
                value: \`<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صفحة</title>
</head>
<body>

</body>
</html>\`,
                language: 'html',
                theme: 'vs-dark',
                automaticLayout: true,
                fontSize: 14,
                suggestOnTriggerCharacters: true
            });

            editor.onDidChangeModelContent(() => {
                vscode.postMessage({
                    type: '${MESSAGE_TYPES.UPDATE_CODE}',
                    code: editor.getValue()
                });
            });

            vscode.postMessage({
                type: '${MESSAGE_TYPES.UPDATE_CODE}',
                code: editor.getValue()
            });
        });
    </script>
</body>
</html>`;
    }

    /**
     * تأخير لمدة محددة
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
