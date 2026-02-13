import * as vscode from 'vscode';
import * as path from 'path';
import { readFile } from 'fs/promises';
import { EditorPanel } from './editorPanel';
import { codeEventEmitter } from '../events/codeEventEmitter';

/**
 * إعدادات WebPageBuilderPanel
 */
const PANEL_CONFIG = {
    VIEW_TYPE: 'webPageBuilder.webviews',
    TITLE: 'Webviews'
} as const;

/**
 * رسائل Webview
 */
const WEBVIEW_MESSAGES = {
    OPEN_BUILDER: 'openBuilder',
    NEW_PROJECT: 'newProject',
    SAVE_AS: 'saveAs',
    INSERT_TAG: 'insertTag',
    SEND_CURRENT_CODE_TO_EDITOR: 'sendCurrentCodeToEditor',
    CODE_UPDATE: 'codeUpdate',
    REQUEST_CURRENT_CODE_FROM_WEBVIEW: 'requestCurrentCodeFromWebview'
} as const;

/**
 * Webview Panel Provider
 * يوفر لوحة Webview منفصلة تفتح في تبويب جديد
 */
export class WebPageBuilderPanel {
    public static currentPanel: WebPageBuilderPanel | undefined;
    public static readonly viewType = PANEL_CONFIG.VIEW_TYPE;

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    /**
     * الحصول على المثيل الحالي من WebPageBuilderPanel
     */
    public static getInstance(): WebPageBuilderPanel | undefined {
        return WebPageBuilderPanel.currentPanel;
    }

    public static createOrShow(extensionUri: vscode.Uri): void {
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
            PANEL_CONFIG.TITLE,
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
            this.handleMessage.bind(this),
            null,
            this._disposables
        );

        // الاستماع إلى أحداث تغيير الكود من EditorPanel وتحديث المعاينة
        this._disposables.push(
            codeEventEmitter.onCodeChange((code: string) => {
                this.updateCode(code);
            })
        );
    }

    /**
     * تهيئة Webview
     */
    private async _initializeWebview(): Promise<void> {
        this._panel.webview.html = await this._getHtmlForWebview(this._panel.webview);
    }

    /**
     * معالج الرسائل من Webview
     */
    private handleMessage(message: any): void {
        switch (message.type) {
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
                // تمرير رسالة إضافة الوسم إلى Webview
                this._panel.webview.postMessage({
                    type: WEBVIEW_MESSAGES.INSERT_TAG,
                    tag: message.tag
                });
                break;
            case WEBVIEW_MESSAGES.SEND_CURRENT_CODE_TO_EDITOR:
                // تمرير الكود الحالي من Webview إلى EditorPanel
                const editorPanel = EditorPanel.getInstance();
                if (editorPanel) {
                    editorPanel.updateValue(message.code);
                }
                break;
        }
    }

    /**
     * تحديث الكود في Webview
     */
    public updateCode(code: string): void {
        this._panel.webview.postMessage({
            type: WEBVIEW_MESSAGES.CODE_UPDATE,
            code: code
        });
    }

    /**
     * طلب الكود الحالي من Webview
     */
    public requestCodeFromWebview(): void {
        this._panel.webview.postMessage({
            type: WEBVIEW_MESSAGES.REQUEST_CURRENT_CODE_FROM_WEBVIEW
        });
    }

    /**
     * تنظيف الموارد
     */
    public dispose(): void {
        WebPageBuilderPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    /**
     * الحصول على محتوى HTML للـ Webview
     */
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
            return htmlContent
                .replace('<link rel="stylesheet" href="webPageBuilderPanel.css">', `<style>${cssContent}</style>`)
                .replace('<script src="webPageBuilderPanel.js"></script>', `<script>${jsContent}</script>`);
        } catch (error) {
            console.error('Error loading webview files:', error);
            return `<html><body><h1>Error loading webview</h1></body></html>`;
        }
    }
}
