import * as vscode from 'vscode';
import { VIEW_TYPES, MESSAGE_TYPES, TIMEOUTS } from '../constants';
import { EditorInfo, WebviewMessage } from '../types';
import { getEditorWebviewContent } from '../webviews/editorWebview';
import { delay } from '../utils/asyncUtils';

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

        this.panel.webview.html = getEditorWebviewContent();

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
        await delay(TIMEOUTS.WEBVIEW_READY);

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
}
