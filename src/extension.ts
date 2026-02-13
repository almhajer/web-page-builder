import * as vscode from 'vscode';
import { EditorPanel } from './panels/editorPanel';
import { WebPageBuilderPanel } from './panels/webPageBuilderPanel';
import { WebPageBuilderSidebarProvider } from './providers/sidebarProvider';
import { registerCommands } from './commands';

/**
 * تفعيل الإضافة
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    // إنشاء EditorPanel أولاً
    await EditorPanel.create(context);

    // فتح Webviews مباشرة عند تفعيل الإضافة
    WebPageBuilderPanel.createOrShow(context.extensionUri);

    // جعل EditorPanel هو التبويب النشط بعد إنشاء جميع اللوحات
    const editorPanel = EditorPanel.getInstance();
    if (editorPanel) {
        // تأخير قصير للتأكد من تحميل اللوحات ثم تفعيل Editor
        setTimeout(() => {
            editorPanel.reveal(vscode.ViewColumn.One);
        }, 100);
    }

    // تسجيل جميع الأوامر
    registerCommands(context);

    // تسجيل عرض السايد بار
    const sidebarProvider = new WebPageBuilderSidebarProvider(context.extensionUri);
    sidebarProvider.setContext(context);
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
