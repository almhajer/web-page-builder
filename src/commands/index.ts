import * as vscode from 'vscode';
import { EditorPanel } from '../panels/editorPanel';
import { WebPageBuilderPanel } from '../panels/webPageBuilderPanel';
import { codeEventEmitter } from '../events/codeEventEmitter';

/**
 * أوامر الإضافة
 */
const COMMANDS = {
    OPEN_BUILDER: 'webPageBuilder.openBuilder',
    UNDO: 'webPageBuilder.undo',
    REDO: 'webPageBuilder.redo',
    VIEW_SOURCE: 'webPageBuilder.viewSource',
    OPEN_FILE: 'webPageBuilder.openFile',
    OPEN_BROWSER: 'webPageBuilder.openBrowser',
    SAVE_AS: 'webPageBuilder.saveAs',
    OPEN_BUILD: 'webPageBuilder.openBuild',
    SETTINGS: 'webPageBuilder.settings',
    OPEN_SETTINGS: 'webPageBuilder.openSettings',
    OPEN_WEBVIEWS: 'webPageBuilder.openWebviews',
    TAGS: 'webPageBuilder.tags',
    METADATA: 'webPageBuilder.metadata',
    CONTENT: 'webPageBuilder.content',
    MEDIA: 'webPageBuilder.media',
    FORMS: 'webPageBuilder.forms',
    INTERACTIVE: 'webPageBuilder.interactive',
    TEXT: 'webPageBuilder.text',
    EMBEDDED: 'webPageBuilder.embedded',
    SCRIPTING: 'webPageBuilder.scripting',
    EDITING: 'webPageBuilder.editing',
    VIEW: 'webPageBuilder.view',
    PREVIEW: 'webPageBuilder.preview',
    DEBUG: 'webPageBuilder.debug',
    PUBLISH: 'webPageBuilder.publish',
    HELP: 'webPageBuilder.help'
} as const;

/**
 * الإعدادات الافتراضية
 */
const DEFAULTS = {
    SAVE_FILENAME: 'index.html',
    MAX_RETRIES: 3,
    TIMEOUT: 15000,
    RETRY_DELAY: 1000
} as const;

/**
 * رسائل الإشعارات
 */
const MESSAGES = {
    EDITOR_NOT_OPEN: 'الرجاء فتح محرر الكود أولاً',
    SAVE_FAILED: 'فشل الحصول على الكود من المحرر بعد عدة محاولات. الرجاء المحاولة مرة أخرى.',
    SAVING: 'جاري حفظ الملف...',
    SAVED: (path: string) => `تم حفظ الملف: ${path}`
} as const;

/**
 * مسار الملف المحفوظ حالياً
 */
let savedFilePath: vscode.Uri | null = null;

/**
 * تسجيل جميع أوامر الإضافة
 */
export function registerCommands(context: vscode.ExtensionContext): void {
    // تسجيل الأوامر الأساسية
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMANDS.OPEN_BUILDER, () => {
            vscode.window.showInformationMessage('Web Page Builder is ready to use!');
        }),

        vscode.commands.registerCommand(COMMANDS.UNDO, () => {
            const editorPanel = EditorPanel.getInstance();
            if (editorPanel) {
                editorPanel.undo();
            }
        }),

        vscode.commands.registerCommand(COMMANDS.REDO, () => {
            const editorPanel = EditorPanel.getInstance();
            if (editorPanel) {
                editorPanel.redo();
            }
        }),

        vscode.commands.registerCommand(COMMANDS.VIEW_SOURCE, async () => {
            let editorPanel = EditorPanel.getInstance();
            const wasClosed = !editorPanel;
            
            if (!editorPanel) {
                // إعادة فتح المحرر إذا كان مغلقاً
                editorPanel = await EditorPanel.create(context);
            }
            if (editorPanel) {
                editorPanel.reveal(vscode.ViewColumn.One);
                
                // إذا كان المحرر مغلقاً، طلب الكود من Webview
                if (wasClosed) {
                    const webviewPanel = WebPageBuilderPanel.getInstance();
                    if (webviewPanel) {
                        // طلب الكود من Webview
                        webviewPanel.requestCodeFromWebview();
                    }
                }
            }
        }),

        vscode.commands.registerCommand(COMMANDS.SAVE_AS, async () => {
            await handleSaveAs();
        }),

        vscode.commands.registerCommand(COMMANDS.OPEN_FILE, async () => {
            await handleOpenFile(context);
        }),

        vscode.commands.registerCommand(COMMANDS.OPEN_BROWSER, async () => {
            await handleOpenBrowser(context);
        }),

        vscode.commands.registerCommand(COMMANDS.OPEN_BUILD, () => {
            vscode.window.showInformationMessage('فتح البناء...');
        }),

        vscode.commands.registerCommand(COMMANDS.SETTINGS, () => {
            vscode.window.showInformationMessage('الإعدادات...');
        }),

        vscode.commands.registerCommand(COMMANDS.OPEN_SETTINGS, async () => {
            await handleOpenSettings(context);
        }),

        vscode.commands.registerCommand(COMMANDS.OPEN_WEBVIEWS, () => {
            WebPageBuilderPanel.createOrShow(context.extensionUri);
        })
    );

    // تسجيل أوامر إجراءات المحرر
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMANDS.TAGS, () => {
            vscode.window.showInformationMessage('قائمة الوسوم HTML...');
            WebPageBuilderPanel.createOrShow(context.extensionUri);
        }),

        vscode.commands.registerCommand(COMMANDS.METADATA, () => {
            vscode.window.showInformationMessage('البيانات الوصفية...');
        }),

        vscode.commands.registerCommand(COMMANDS.CONTENT, () => {
            vscode.window.showInformationMessage('المحتوى...');
        }),

        vscode.commands.registerCommand(COMMANDS.MEDIA, () => {
            vscode.window.showInformationMessage('الوسائط...');
        }),

        vscode.commands.registerCommand(COMMANDS.FORMS, () => {
            vscode.window.showInformationMessage('النماذج...');
        }),

        vscode.commands.registerCommand(COMMANDS.INTERACTIVE, () => {
            vscode.window.showInformationMessage('العناصر التفاعلية...');
        }),

        vscode.commands.registerCommand(COMMANDS.TEXT, () => {
            vscode.window.showInformationMessage('النصوص...');
        }),

        vscode.commands.registerCommand(COMMANDS.EMBEDDED, () => {
            vscode.window.showInformationMessage('المحتوى المدمج...');
        }),

        vscode.commands.registerCommand(COMMANDS.SCRIPTING, () => {
            vscode.window.showInformationMessage('السكربت...');
        }),

        vscode.commands.registerCommand(COMMANDS.EDITING, () => {
            vscode.window.showInformationMessage('تعديل النصوص...');
        }),

        vscode.commands.registerCommand(COMMANDS.VIEW, () => {
            vscode.window.showInformationMessage('العرض...');
        }),

        vscode.commands.registerCommand(COMMANDS.PREVIEW, () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                vscode.window.showInformationMessage('معاينة الصفحة...');
            }
        }),

        vscode.commands.registerCommand(COMMANDS.DEBUG, () => {
            vscode.window.showInformationMessage('التصحيح...');
        }),

        vscode.commands.registerCommand(COMMANDS.PUBLISH, () => {
            vscode.window.showInformationMessage('النشر...');
        }),

        vscode.commands.registerCommand(COMMANDS.HELP, () => {
            vscode.window.showInformationMessage('المساعدة...');
        })
    );
}

/**
 * معالجة أمر حفظ باسم
 */
async function handleSaveAs(): Promise<void> {
    const editorPanel = EditorPanel.getInstance();
    
    // التأكد من أن EditorPanel مفتوح
    if (!editorPanel) {
        vscode.window.showErrorMessage(MESSAGES.EDITOR_NOT_OPEN);
        return;
    }

    // إظهار EditorPanel والتأكد من جاهزيته
    editorPanel.reveal(vscode.ViewColumn.One);
    await new Promise(resolve => setTimeout(resolve, 500));

    // الحصول على الكود مع إعادة المحاولة
    let code: string;
    try {
        code = await getCodeWithRetry(editorPanel);
    } catch (error) {
        vscode.window.showErrorMessage(MESSAGES.SAVE_FAILED);
        return;
    }

    // التحقق من وجود مسار محفوظ مسبقاً
    if (savedFilePath) {
        // حفظ مباشر إلى الملف المحفوظ
        await saveFileWithProgress(savedFilePath, code);
    } else {
        // فتح نافذة حفظ باسم
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(DEFAULTS.SAVE_FILENAME),
            filters: {
                'HTML Files': ['html'],
                'All Files': ['*']
            }
        });

        if (!uri) {
            return;
        }

        // تخزين المسار للحفظ المستقبلي
        savedFilePath = uri;
        
        // حفظ الملف مع شريط تقدم
        await saveFileWithProgress(uri, code);
    }
}

/**
 * إعادة تعيين مسار الملف المحفوظ (عند إنشاء مشروع جديد)
 */
export function resetSavedFilePath(): void {
    savedFilePath = null;
}

/**
 * الحصول على مسار الملف المحفوظ
 */
export function getSavedFilePath(): vscode.Uri | null {
    return savedFilePath;
}

/**
 * الحصول على الكود مع إعادة المحاولة
 */
async function getCodeWithRetry(editorPanel: EditorPanel): Promise<string> {
    for (let attempt = 1; attempt <= DEFAULTS.MAX_RETRIES; attempt++) {
        try {
            return await editorPanel.requestCodeWithRetry(attempt, DEFAULTS.MAX_RETRIES);
        } catch (error) {
            if (attempt < DEFAULTS.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, DEFAULTS.RETRY_DELAY));
            } else {
                throw error;
            }
        }
    }
    throw new Error('فشل الحصول على الكود');
}

/**
 * حفظ الملف مع شريط تقدم
 */
async function saveFileWithProgress(uri: vscode.Uri, code: string): Promise<void> {
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: MESSAGES.SAVING,
        cancellable: false
    }, async (progress) => {
        progress.report({ increment: 0, message: 'بدء الحفظ...' });
        await new Promise(resolve => setTimeout(resolve, 100));

        progress.report({ increment: 30, message: 'جاري معالجة الكود...' });
        await new Promise(resolve => setTimeout(resolve, 200));

        progress.report({ increment: 60, message: 'جاري الكتابة إلى الملف...' });
        await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf8'));

        progress.report({ increment: 100, message: 'تم الحفظ بنجاح!' });
        await new Promise(resolve => setTimeout(resolve, 200));
    });

    vscode.window.showInformationMessage(MESSAGES.SAVED(uri.fsPath));
}

/**
 * معالجة أمر فتح ملف
 */
async function handleOpenFile(context: vscode.ExtensionContext): Promise<void> {
    // فتح نافذة اختيار الملف
    const uris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: {
            'HTML Files': ['html', 'xhtml'],
            'All Files': ['*']
        },
        title: 'اختر ملف HTML'
    });

    if (!uris || uris.length === 0) {
        return;
    }

    const fileUri = uris[0];

    try {
        // قراءة محتوى الملف
        const fileContent = await vscode.workspace.fs.readFile(fileUri);
        const code = Buffer.from(fileContent).toString('utf8');

        // الحصول على EditorPanel
        let editorPanel = EditorPanel.getInstance();
        
        // التحقق مما إذا كان المحرر يحتوي على كود مختلف عن الافتراضي
        const defaultHtml = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صفحة</title>
</head>
<body>

</body>
</html>`;

        // إذا كان المحرر مفتوحاً، نحتاج للتحقق من الكود الحالي
        if (editorPanel) {
            // طلب الكود الحالي من المحرر
            let currentCode = '';
            try {
                currentCode = await editorPanel.requestCodeWithRetry(1, 1);
            } catch (e) {
                // تجاهل الخطأ
            }

            // مقارنة الكود الحالي مع الافتراضي
            const isDefaultCode = currentCode.trim() === defaultHtml.trim() || currentCode.trim() === '';
            
            if (!isDefaultCode) {
                // إظهار رسالة تأكيد
                const choice = await vscode.window.showWarningMessage(
                    'المحرر يحتوي على كود. هل تريد استبداله بمحتوى الملف؟',
                    'نعم',
                    'لا'
                );
                
                if (choice !== 'نعم') {
                    return;
                }
            }
        } else {
            // إنشاء المحرر إذا كان مغلقاً
            editorPanel = await EditorPanel.create(context);
        }

        if (editorPanel) {
            // تحديث المحرر بالكود الجديد
            editorPanel.updateValue(code);
            editorPanel.reveal(vscode.ViewColumn.One);
            
            // تحديث المعاينة
            codeEventEmitter.emitCodeChange(code);
            
            vscode.window.showInformationMessage(`تم تحميل الملف: ${fileUri.fsPath}`);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`فشل في قراءة الملف: ${error}`);
    }
}

/**
 * معالجة أمر فتح في المتصفح
 */
async function handleOpenBrowser(context: vscode.ExtensionContext): Promise<void> {
    const editorPanel = EditorPanel.getInstance();
    
    // التأكد من أن EditorPanel مفتوح
    if (!editorPanel) {
        vscode.window.showErrorMessage(MESSAGES.EDITOR_NOT_OPEN);
        return;
    }

    // إظهار EditorPanel والتأكد من جاهزيته
    editorPanel.reveal(vscode.ViewColumn.One);
    await new Promise(resolve => setTimeout(resolve, 500));

    // الحصول على الكود مع إعادة المحاولة
    let code: string;
    try {
        code = await getCodeWithRetry(editorPanel);
    } catch (error) {
        vscode.window.showErrorMessage(MESSAGES.SAVE_FAILED);
        return;
    }

    // إنشاء ملف HTML مؤقت
    const tempDir = vscode.Uri.joinPath(context.globalStorageUri, 'temp');
    await vscode.workspace.fs.createDirectory(tempDir).then(() => {}, () => {});
    
    const timestamp = Date.now();
    const tempFileUri = vscode.Uri.joinPath(tempDir, `preview-${timestamp}.html`);
    
    await vscode.workspace.fs.writeFile(tempFileUri, Buffer.from(code, 'utf8'));
    
    // فتح الملف في المتصفح الافتراضي
    vscode.env.openExternal(tempFileUri);
    
    vscode.window.showInformationMessage('تم فتح الصفحة في المتصفح');
}

/**
 * معالجة أمر فتح الإعدادات
 */
async function handleOpenSettings(context: vscode.ExtensionContext): Promise<void> {
    // استيراد SettingsPanel بشكل ديناميكي لتجنب الاعتماد الدائري
    const { SettingsPanel } = await import('../panels/settingsPanel');
    await SettingsPanel.create(context);
}
