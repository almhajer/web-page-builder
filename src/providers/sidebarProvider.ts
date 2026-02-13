import * as vscode from 'vscode';
import * as path from 'path';
import { readFile } from 'fs/promises';

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
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = await this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage((data) => {
            switch (data.type) {
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
                    vscode.window.showInformationMessage(`<${data.tag}>`);
                    break;
            }
        });
    }

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
            let finalHtml = htmlContent
                .replace('<link rel="stylesheet" href="sidebar.css">', `<style>${cssContent}</style>`)
                .replace('<script src="sidebar.js"></script>', `<script>${jsContent}</script>`);

            return finalHtml;
        } catch (error) {
            console.error('Error loading sidebar webview files:', error);
            return `<html><body><h1>Error loading sidebar</h1></body></html>`;
        }
    }
}
