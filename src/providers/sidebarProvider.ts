import * as vscode from 'vscode';
import * as path from 'path';
import { readFile } from 'fs/promises';
import { EditorPanel } from '../panels/editorPanel';

/**
 * رسائل Webview
 */
const WEBVIEW_MESSAGES = {
    OPEN_BUILDER: 'openBuilder',
    NEW_PROJECT: 'newProject',
    SAVE_AS: 'saveAs',
    INSERT_TAG: 'insertTag'
} as const;

/**
 * WebPageBuilderSidebarProvider - موفر Sidebar View
 */
export class WebPageBuilderSidebarProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): Promise<void> {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = await this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage((data) => {
            this.handleMessage(data);
        });
    }

    /**
     * معالج الرسائل من Webview
     */
    private handleMessage(data: any): void {
        switch (data.type) {
            case WEBVIEW_MESSAGES.OPEN_BUILDER:
                vscode.window.showInformationMessage('Opening Web Page Builder...');
                break;
            case WEBVIEW_MESSAGES.NEW_PROJECT:
                vscode.window.showInformationMessage('Creating new project...');
                break;
            case WEBVIEW_MESSAGES.SAVE_AS:
                vscode.window.showInformationMessage('Saving as...');
                break;
            case WEBVIEW_MESSAGES.INSERT_TAG:
                // إدراج كود الوسم في مكان المؤشر في المحرر
                const editorPanel = EditorPanel.getInstance();
                if (editorPanel) {
                    const tag = data.tag;
                    const tagCode = this.generateTagCode(tag);
                    editorPanel.insertTextAtCursor(tagCode);
                }
                break;
        }
    }

    /**
     * توليد كود الوسم
     */
    private generateTagCode(tag: string): string {
        // قائمة الوسوم التي تحتاج إلى محتوى افتراضي
        const tagsWithContent = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'a', 'img', 'input', 'textarea'];
        
        if (tagsWithContent.includes(tag)) {
            return `<${tag}></${tag}>`;
        }
        
        // الوسوم الفارغة
        return `<${tag}>`;
    }

    /**
     * الحصول على محتوى HTML للـ Sidebar
     */
    private async _getHtmlForWebview(webview: vscode.Webview): Promise<string> {
        try {
            const htmlPath = path.join(this._extensionUri.fsPath, 'src', 'webviews', 'sidebarWebview.html');
            const cssPath = path.join(this._extensionUri.fsPath, 'src', 'webviews', 'sidebar.css');
            const jsPath = path.join(this._extensionUri.fsPath, 'src', 'webviews', 'sidebar.js');

            const [htmlContent, cssContent, jsContent] = await Promise.all([
                readFile(htmlPath, 'utf-8'),
                readFile(cssPath, 'utf-8'),
                readFile(jsPath, 'utf-8')
            ]);

            // استبدال روابط CSS و JS بالمحتوى المباشر
            return htmlContent
                .replace('<link rel="stylesheet" href="sidebar.css">', `<style>${cssContent}</style>`)
                .replace('<script src="sidebar.js"></script>', `<script>${jsContent}</script>`);
        } catch (error) {
            console.error('Error loading sidebar webview files:', error);
            return `<html><body><h1>Error loading sidebar</h1></body></html>`;
        }
    }
}
