import * as vscode from 'vscode';
import path from 'path';
import { readFile } from 'fs/promises';

/**
 * فئة EditorPanel لإدارة لوحة المحرر
 */
export class EditorPanel {
    private static instance: EditorPanel | null = null;
    private panel: vscode.WebviewPanel;
    private pendingCodeRequest: { requestId: string; resolver: (code: string) => void } | null = null;

    private constructor(panel: vscode.WebviewPanel) {
        this.panel = panel;
        this.setupEventHandlers();
    }

    /**
     * إنشاء أو الحصول على مثيل EditorPanel
     */
    public static getInstance(): EditorPanel | null {
        return EditorPanel.instance;
    }

    /**
     * إنشاء EditorPanel جديد
     */
    public static async create(context: vscode.ExtensionContext): Promise<EditorPanel> {
        if (EditorPanel.instance) {
            return EditorPanel.instance;
        }

        const panel = vscode.window.createWebviewPanel(
            'Editor',
            'Editor',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
            }
        );

        // تعيين محتوى HTML للـ webview
        panel.webview.html = await getEditorHtml();

        EditorPanel.instance = new EditorPanel(panel);
        return EditorPanel.instance;
    }

    /**
     * الحصول على WebviewPanel
     */
    public getWebviewPanel(): vscode.WebviewPanel {
        return this.panel;
    }

    /**
     * إظهار اللوحة
     */
    public reveal(column?: vscode.ViewColumn): void {
        this.panel.reveal(column);
    }

    /**
     * طلب الكود من المحرر مع إعادة المحاولة
     */
    public async requestCodeWithRetry(attempt: number, maxAttempts: number): Promise<string> {
        const requestId = Date.now().toString() + '-' + attempt;

        return new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingCodeRequest = null;
                reject(new Error('Timeout'));
            }, 15000); // مهلة 15 ثانية

            this.pendingCodeRequest = {
                requestId: requestId,
                resolver: (receivedCode: string) => {
                    clearTimeout(timeout);
                    resolve(receivedCode);
                }
            };

            // إرسال الطلب للـ Webview للحصول على الكود الحالي
            this.panel.webview.postMessage({
                type: 'requestCurrentCode',
                requestId: requestId
            });
        });
    }

    /**
     * إعداد معالجات الأحداث
     */
    private setupEventHandlers(): void {
        // معالج حدث إغلاق اللوحة
        this.panel.onDidDispose(() => {
            console.log('Editor panel was closed');
            EditorPanel.instance = null;
        });

        // معالج حدث تغيير حالة العرض
        this.panel.onDidChangeViewState(() => {
            if (this.panel.visible) {
                console.log('Editor panel activated');
            }
        });

        // معالج رسائل من EditorPanel
        this.panel.webview.onDidReceiveMessage(async (message) => {
            console.log('Extension received message from EditorPanel:', message);
            console.log('Pending request:', this.pendingCodeRequest ? this.pendingCodeRequest.requestId : 'none');
            
            switch (message.type) {
                case 'updateCode':
                    // التحقق من وجود طلب كود معلق مع requestId مطابق
                    if (this.pendingCodeRequest && message.requestId === this.pendingCodeRequest.requestId) {
                        console.log('Match found! Resolving promise with code...');
                        const { resolver } = this.pendingCodeRequest;
                        this.pendingCodeRequest = null;
                        resolver(message.code);
                    }
                    break;
                case 'requestCodeFromWebview':
                    // سيتم التعامل مع هذا في WebPageBuilderPanel
                    break;
            }
        });
    }

    /**
     * تحديث قيمة المحرر
     */
    public updateValue(code: string): void {
        this.panel.webview.postMessage({
            type: 'updateEditorValue',
            code: code
        });
    }

    /**
     * طلب الكود الحالي
     */
    public requestCurrentCode(): void {
        const requestId = Date.now().toString();
        this.panel.webview.postMessage({
            type: 'requestCurrentCode',
            requestId: requestId
        });
    }
}

/**
 * الحصول على محتوى HTML لمحرر Monaco
 */
async function getEditorHtml(): Promise<string> {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs/loader.min.js"></script>
    <style>
        body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background-color: #1e1e1e; }
        #container { height: 100vh; width: 100%; }
    </style>
</head>
<body>
    <div id="container"></div>

    <script>
        const vscode = acquireVsCodeApi();
        let editor = null;

        window.addEventListener('message', event => {
            const message = event.data;
            console.log('Webview received message:', message);
            console.log('Editor exists:', editor !== null);

            switch (message.type) {
                case 'updateEditorValue':
                    if (editor) {
                        editor.setValue(message.code);
                    }
                    break;
                case 'requestCurrentCode':
                    if (editor) {
                        const code = editor.getValue();
                        console.log('Sending code to extension, length:', code.length);
                        vscode.postMessage({
                            type: 'updateCode',
                            code: code,
                            requestId: message.requestId
                        });
                    }
                    break;
                case 'requestCurrentCodeFromWebview':
                    // طلب الكود الحالي من WebviewPanel
                    vscode.postMessage({
                        type: 'requestCodeFromWebview'
                    });
                    break;
            }
        });

        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs' }});

        require(['vs/editor/editor.main'], function() {
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

            // إرسال الكود الأولي فقط عند تحميل المحرر
            vscode.postMessage({
                type: 'updateCode',
                code: editor.getValue()
            });
        });
    </script>
</body>
</html>`;
}
