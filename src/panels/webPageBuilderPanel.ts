import * as vscode from 'vscode';
import * as path from 'path';
import { readFile } from 'fs/promises';
import { EditorPanel } from './editorPanel';

/**
 * Webview Panel Provider
 * يوفر لوحة Webview منفصلة تفتح في تبويب جديد
 */
export class WebPageBuilderPanel {
    public static currentPanel: WebPageBuilderPanel | undefined;
    public static readonly viewType = 'webPageBuilder.webviews';

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // إذا كان اللوحة موجودة بالفعل، قم بإظهارها
        if (WebPageBuilderPanel.currentPanel) {
            WebPageBuilderPanel.currentPanel._panel.reveal(column);
            // طلب الكود الحالي من EditorPanel عند إعادة فتح التبويب
            const editorPanel = EditorPanel.getInstance();
            if (editorPanel) {
                editorPanel.requestCurrentCode();
            }
            return;
        }

        // إنشاء لوحة جديدة
        const panel = vscode.window.createWebviewPanel(
            WebPageBuilderPanel.viewType,
            'Webviews',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true
            }
        );

        WebPageBuilderPanel.currentPanel = new WebPageBuilderPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, private readonly _extensionUri: vscode.Uri) {
        this._panel = panel;

        // تعيين محتوى Webview - عرض iframe لمعاينة الكود
        this._initializeWebview();

        // الاستماع إلى أحداث إغلاق اللوحة
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // الاستماع إلى أحداث تغيير حالة العرض (عند إعادة فتح التبويب)
        this._panel.onDidChangeViewState(() => {
            if (this._panel.visible) {
                // طلب الكود الحالي من EditorPanel عند إعادة فتح التبويب
                const editorPanel = EditorPanel.getInstance();
                if (editorPanel) {
                    editorPanel.requestCurrentCode();
                }
            }
        }, null, this._disposables);

        // الاستماع إلى الرسائل من Webview - تمرير الرسائل إلى Extension
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'openBuilder':
                        vscode.window.showInformationMessage('Opening Web Page Builder...');
                        break;
                    case 'newProject':
                        vscode.window.showInformationMessage('Creating new project...');
                        break;
                    case 'saveAs':
                        vscode.window.showInformationMessage('Saving as...');
                        break;
                    case 'insertTag':
                        // تمرير رسالة إضافة الوسم إلى Webview
                        this._panel.webview.postMessage({
                            type: 'insertTag',
                            tag: message.tag
                        });
                        break;
                    case 'sendCurrentCodeToEditor':
                        // تمرير الكود الحالي من Webview إلى EditorPanel
                        const editorPanel = EditorPanel.getInstance();
                        if (editorPanel) {
                            editorPanel.updateValue(message.code);
                        }
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    /**
     * تهيئة Webview
     */
    private async _initializeWebview(): Promise<void> {
        this._panel.webview.html = await this._getHtmlForWebview(this._panel.webview);
    }

    public updateCode(code: string) {
        // إرسال الكود إلى webview لتحديث العرض
        this._panel.webview.postMessage({
            type: 'codeUpdate',
            code: code
        });
    }

    public requestCodeFromWebview() {
        // طلب الكود الحالي من webview
        this._panel.webview.postMessage({
            type: 'requestCurrentCodeFromWebview'
        });
    }

    public dispose() {
        WebPageBuilderPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private async _getHtmlForWebview(webview: vscode.Webview): Promise<string> {
        try {
            const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'webviews', 'webPageBuilderPanel.html');
            const cssPath = path.join(this._extensionUri.fsPath, 'src', 'webviews', 'webPageBuilderPanel.css');
            const jsPath = path.join(this._extensionUri.fsPath, 'src', 'webviews', 'webPageBuilderPanel.js');

            const [htmlContent, cssContent, jsContent] = await Promise.all([
                readFile(htmlPath, 'utf-8'),
                readFile(cssPath, 'utf-8'),
                readFile(jsPath, 'utf-8')
            ]);

            // استبدال روابط CSS و JS بالمحتوى المباشر
            let finalHtml = htmlContent
                .replace('<link rel="stylesheet" href="webPageBuilderPanel.css">', `<style>${cssContent}</style>`)
                .replace('<script src="webPageBuilderPanel.js"></script>', `<script>${jsContent}</script>`);

            return finalHtml;
        } catch (error) {
            console.error('Error loading webview files:', error);
            return `<html><body><h1>Error loading webview</h1></body></html>`;
        }
    }
}
