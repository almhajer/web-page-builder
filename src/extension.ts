import * as vscode from 'vscode';
import { EditorPanel } from './panels/editorPanel';
import { WebPageBuilderPanel } from './panels/webPageBuilderPanel';
import { WebPageBuilderSidebarProvider } from './providers/sidebarProvider';
import { registerCommands } from './commands';

/**
 * تفعيل الإضافة
 */
export function activate(context: vscode.ExtensionContext): void {
    // إنشاء EditorPanel
    EditorPanel.create(context);

    // فتح Webviews مباشرة عند تفعيل الإضافة
    WebPageBuilderPanel.createOrShow(context.extensionUri);

    // تسجيل جميع الأوامر
    registerCommands(context);

    // تسجيل عرض السايد بار
    const sidebarProvider = new WebPageBuilderSidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('webPageBuilder.sidebar', sidebarProvider)
    );
}

/**
 * إلغاء تفعيل الإضافة
 */
export function deactivate(): void {
    console.log('Web Page Builder extension is now deactivated!');
}
