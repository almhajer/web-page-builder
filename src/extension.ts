import * as vscode from 'vscode';
import { EditorPanel } from './panels/editorPanel';
import { WebPageBuilderPanel } from './panels/webPageBuilderPanel';
import { WebPageBuilderSidebarProvider } from './providers/sidebarProvider';
import { registerCommands } from './commands';
import { loadLocale, getLocale } from './locales/localeService';

/**
 * تفعيل الإضافة
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    // تحميل اللغة عند تفعيل الإضافة
    loadLocale(getLocale());

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

    // إضافة مستمع لتغييرات إعدادات VSCode
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(async (e) => {
        if (e.affectsConfiguration('webPageBuilder.language')) {
            // إعادة تحميل اللغة عند تغيير إعداد اللغة في الإضافة
            const newLocale = getLocale();
            loadLocale(newLocale);
            
            // إرسال تحديث الترجمات للسايد بار
            vscode.commands.executeCommand('webPageBuilder.updateSidebarLocale');
        }
        
        // مراقبة تغيير لغة VSCode نفسها
        if (e.affectsConfiguration('general.locale')) {
            const config = vscode.workspace.getConfiguration('webPageBuilder');
            const languageSetting = config.get<string>('language', 'auto');
            
            if (languageSetting === 'auto') {
                // إعادة تحميل اللغة فقط إذا كان الإعداد على "تلقائي"
                const newLocale = getLocale();
                loadLocale(newLocale);
                
                // إرسال تحديث الترجمات للسايد بار
                vscode.commands.executeCommand('webPageBuilder.updateSidebarLocale');
            }
        }
    });
    context.subscriptions.push(configChangeListener);
}

/**
 * إلغاء تفعيل الإضافة
 */
export function deactivate(): void {
    console.log('Web Page Builder extension is now deactivated!');
}
