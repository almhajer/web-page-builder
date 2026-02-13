import * as vscode from 'vscode';
import { EditorPanel } from '../panels/editorPanel';
import { WebPageBuilderPanel } from '../panels/webPageBuilderPanel';

/**
 * تسجيل جميع أوامر الإضافة
 */
export function registerCommands(context: vscode.ExtensionContext) {
    // تسجيل أمر فتح البناء
    const openBuilderCommand = vscode.commands.registerCommand('webPageBuilder.openBuilder', () => {
        vscode.window.showInformationMessage('Web Page Builder is ready to use!');
    });

    // تسجيل أمر التحديث
    const refreshCommand = vscode.commands.registerCommand('webPageBuilder.refresh', () => {
        vscode.window.showInformationMessage('Web Page Builder refreshed!');
    });

    // تسجيل أمر تفعيل تاب editor
    const newProjectCommand = vscode.commands.registerCommand('webPageBuilder.newProject', () => {
        // تنشيط Editor إذا كان مخفياً
        if (EditorPanel.getInstance()) {
            EditorPanel.getInstance()!.reveal(vscode.ViewColumn.One);
        }
    });

    // تسجيل أمر حفظ باسم
    const saveAsCommand = vscode.commands.registerCommand('webPageBuilder.saveAs', async () => {
        const editorPanel = EditorPanel.getInstance();
        
        // التأكد من أن EditorPanel لا يزال مفتوحاً
        if (!editorPanel) {
            vscode.window.showErrorMessage('الرجاء فتح محرر الكود أولاً');
            return;
        }

        // إظهار EditorPanel للتأكد من أنه نشط
        editorPanel.reveal(vscode.ViewColumn.One);

        // انتظار أطول للتأكد من أن الـ webview جاهز تماماً
        await new Promise(resolve => setTimeout(resolve, 500));

        // الحصول على الكود من EditorPanel مع معالجة الخطأ وإعادة المحاولة
        let code: string;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            attempts++;
            
            try {
                code = await editorPanel.requestCodeWithRetry(attempts, maxAttempts);
                
                // إذا نجحنا في الحصول على الكود، اخرج من الحلقة
                break;
                
            } catch (error) {
                
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    vscode.window.showErrorMessage('فشل الحصول على الكود من المحرر بعد عدة محاولات. الرجاء المحاولة مرة أخرى.');
                    return;
                }
            }
        }

        // فتح نافذة حفظ باسم بعد الحصول على الكود
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('index.html'),
            filters: {
                'HTML Files': ['html'],
                'All Files': ['*']
            }
        });

        if (!uri) return; // الخروج إذا لم يتم اختيار مسار

        // إنشاء شريط تقدم
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'جاري حفظ الملف...',
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'بدء الحفظ...' });
            await new Promise(resolve => setTimeout(resolve, 100));

            progress.report({ increment: 30, message: 'جاري معالجة الكود...' });
            await new Promise(resolve => setTimeout(resolve, 200));

            progress.report({ increment: 60, message: 'جاري الكتابة إلى الملف...' });

            // حفظ الكود باستخدام vscode.workspace.fs.writeFile
            await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf8'));

            progress.report({ increment: 100, message: 'تم الحفظ بنجاح!' });
            await new Promise(resolve => setTimeout(resolve, 200));
        });

        vscode.window.showInformationMessage(`تم حفظ الملف: ${uri.fsPath}`);
    });

    // تسجيل أمر فتح البناء
    const openBuildCommand = vscode.commands.registerCommand('webPageBuilder.openBuild', () => {
        vscode.window.showInformationMessage('فتح البناء...');
    });

    // تسجيل أمر الإعدادات
    const settingsCommand = vscode.commands.registerCommand('webPageBuilder.settings', () => {
        vscode.window.showInformationMessage('الإعدادات...');
    });

    // تسجيل أمر فتح Webviews Panel
    const openWebviewsCommand = vscode.commands.registerCommand('webPageBuilder.openWebviews', () => {
        WebPageBuilderPanel.createOrShow(context.extensionUri);
    });

    // تسجيل أوامر إجراءات المحرر الجديدة
    const tagsCommand = vscode.commands.registerCommand('webPageBuilder.tags', () => {
        vscode.window.showInformationMessage('قائمة الوسوم HTML...');
        WebPageBuilderPanel.createOrShow(context.extensionUri);
    });

    const metadataCommand = vscode.commands.registerCommand('webPageBuilder.metadata', () => {
        vscode.window.showInformationMessage('البيانات الوصفية...');
    });

    const contentCommand = vscode.commands.registerCommand('webPageBuilder.content', () => {
        vscode.window.showInformationMessage('المحتوى...');
    });

    const mediaCommand = vscode.commands.registerCommand('webPageBuilder.media', () => {
        vscode.window.showInformationMessage('الوسائط...');
    });

    const formsCommand = vscode.commands.registerCommand('webPageBuilder.forms', () => {
        vscode.window.showInformationMessage('النماذج...');
    });

    const interactiveCommand = vscode.commands.registerCommand('webPageBuilder.interactive', () => {
        vscode.window.showInformationMessage('العناصر التفاعلية...');
    });

    const textCommand = vscode.commands.registerCommand('webPageBuilder.text', () => {
        vscode.window.showInformationMessage('النصوص...');
    });

    const embeddedCommand = vscode.commands.registerCommand('webPageBuilder.embedded', () => {
        vscode.window.showInformationMessage('المحتوى المدمج...');
    });

    const scriptingCommand = vscode.commands.registerCommand('webPageBuilder.scripting', () => {
        vscode.window.showInformationMessage('السكربت...');
    });

    const editingCommand = vscode.commands.registerCommand('webPageBuilder.editing', () => {
        vscode.window.showInformationMessage('تعديل النصوص...');
    });

    const viewCommand = vscode.commands.registerCommand('webPageBuilder.view', () => {
        vscode.window.showInformationMessage('العرض...');
    });

    const previewCommand = vscode.commands.registerCommand('webPageBuilder.preview', () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            vscode.window.showInformationMessage('معاينة الصفحة...');
            // يمكن إضافة منطق لفتح معاينة حقيقية هنا
        }
    });

    const debugCommand = vscode.commands.registerCommand('webPageBuilder.debug', () => {
        vscode.window.showInformationMessage('التصحيح...');
    });

    const publishCommand = vscode.commands.registerCommand('webPageBuilder.publish', () => {
        vscode.window.showInformationMessage('النشر...');
    });

    const helpCommand = vscode.commands.registerCommand('webPageBuilder.help', () => {
        vscode.window.showInformationMessage('المساعدة...');
    });

    // إضافة جميع الأوامر إلى context.subscriptions
    context.subscriptions.push(
        openBuilderCommand,
        refreshCommand,
        newProjectCommand,
        saveAsCommand,
        openBuildCommand,
        settingsCommand,
        openWebviewsCommand,
        tagsCommand,
        metadataCommand,
        contentCommand,
        mediaCommand,
        formsCommand,
        interactiveCommand,
        textCommand,
        embeddedCommand,
        scriptingCommand,
        editingCommand,
        viewCommand,
        previewCommand,
        debugCommand,
        publishCommand,
        helpCommand
    );
}
