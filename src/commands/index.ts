import * as vscode from 'vscode';
import { EditorPanel } from '../panels/editorPanel';
import { WebPageBuilderPanel } from '../panels/webPageBuilderPanel';
import { codeEventEmitter } from '../events/codeEventEmitter';
import { t } from '../locales/localeService';

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
    UPDATE_SIDEBAR_LOCALE: 'webPageBuilder.updateSidebarLocale',
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
    EDITOR_NOT_OPEN: () => t('messages.editorNotOpen'),
    SAVE_FAILED: () => t('messages.saveFailed'),
    SAVING: () => t('messages.saving'),
    SAVED: (path: string) => t('messages.fileSaved', { path })
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
            vscode.window.showInformationMessage(t('commands.openBuilder'));
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
            vscode.window.showInformationMessage(t('commands.openBuild'));
        }),

        vscode.commands.registerCommand(COMMANDS.OPEN_SETTINGS, async () => {
            await handleOpenSettings(context);
        }),

        vscode.commands.registerCommand(COMMANDS.UPDATE_SIDEBAR_LOCALE, () => {
            const { WebPageBuilderSidebarProvider } = require('../providers/sidebarProvider');
            // تحديث ترجمات sidebar عن طريق إرسال رسالة للـ provider
            // سيتم التعامل مع هذا الأمر في sidebarProvider
            // تحديث الترجمات فعلياً
            const { loadLocale, getLocale } = require('../locales/localeService');
            loadLocale(getLocale());
        }),

        vscode.commands.registerCommand(COMMANDS.OPEN_WEBVIEWS, () => {
            WebPageBuilderPanel.createOrShow(context.extensionUri);
        })
    );

    // تسجيل أوامر إجراءات المحرر
    context.subscriptions.push(
        vscode.commands.registerCommand(COMMANDS.TAGS, () => {
            vscode.window.showInformationMessage(t('commands.tags'));
            WebPageBuilderPanel.createOrShow(context.extensionUri);
        }),

        vscode.commands.registerCommand(COMMANDS.METADATA, () => {
            vscode.window.showInformationMessage(t('commands.metadata'));
        }),

        vscode.commands.registerCommand(COMMANDS.CONTENT, () => {
            vscode.window.showInformationMessage(t('commands.content'));
        }),

        vscode.commands.registerCommand(COMMANDS.MEDIA, () => {
            vscode.window.showInformationMessage(t('commands.media'));
        }),

        vscode.commands.registerCommand(COMMANDS.FORMS, () => {
            vscode.window.showInformationMessage(t('commands.forms'));
        }),

        vscode.commands.registerCommand(COMMANDS.INTERACTIVE, () => {
            vscode.window.showInformationMessage(t('commands.interactive'));
        }),

        vscode.commands.registerCommand(COMMANDS.TEXT, () => {
            vscode.window.showInformationMessage(t('commands.text'));
        }),

        vscode.commands.registerCommand(COMMANDS.EMBEDDED, () => {
            vscode.window.showInformationMessage(t('commands.embedded'));
        }),

        vscode.commands.registerCommand(COMMANDS.SCRIPTING, () => {
            vscode.window.showInformationMessage(t('commands.scripting'));
        }),

        vscode.commands.registerCommand(COMMANDS.EDITING, () => {
            vscode.window.showInformationMessage(t('commands.editing'));
        }),

        vscode.commands.registerCommand(COMMANDS.VIEW, () => {
            vscode.window.showInformationMessage(t('commands.view'));
        }),

        vscode.commands.registerCommand(COMMANDS.PREVIEW, async () => {
            await handleOpenWorkspaceFileInBrowser(context);
        }),

        vscode.commands.registerCommand(COMMANDS.DEBUG, () => {
            vscode.window.showInformationMessage(t('commands.debug'));
        }),

        vscode.commands.registerCommand(COMMANDS.PUBLISH, () => {
            vscode.window.showInformationMessage(t('commands.publish'));
        }),

        vscode.commands.registerCommand(COMMANDS.HELP, () => {
            vscode.window.showInformationMessage(t('commands.help'));
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
        vscode.window.showErrorMessage(MESSAGES.EDITOR_NOT_OPEN());
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
        vscode.window.showErrorMessage(MESSAGES.SAVE_FAILED());
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
        title: MESSAGES.SAVING(),
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
/**
 * فتح ملف HTML في المتصفح الافتراضي
 * @param fileUri - URI للملف HTML المراد فتحه
 * @returns Promise<boolean> - true إذا تم الفتح بنجاح، false في حالة الفشل
 */
async function openHtmlInBrowser(fileUri: vscode.Uri): Promise<boolean> {
    try {
        // التأكد من أن الملف موجود
        try {
            await vscode.workspace.fs.stat(fileUri);
        } catch (error) {
            vscode.window.showErrorMessage(t('messages.fileNotFound', { path: fileUri.fsPath }));
            return false;
        }

        // فتح الملف في المتصفح الافتراضي باستخدام URI مباشر
        // vscode.env.openExternal يعمل بشكل صحيح مع file:// URIs على جميع المنصات
        const success = await vscode.env.openExternal(fileUri);
        
        if (success) {
            return true;
        } else {
            vscode.window.showErrorMessage(t('messages.browserOpenFailed'));
            return false;
        }
    } catch (error) {
        vscode.window.showErrorMessage(t('messages.browserOpenError', { error: String(error) }));
        return false;
    }
}

/**
 * فتح محتوى HTML في المتصفح الافتراضي
 * @param htmlContent - محتوى HTML المراد فتحه
 * @param context - سياق الإضافة
 * @returns Promise<boolean> - true إذا تم الفتح بنجاح، false في حالة الفشل
 */
async function openHtmlContentInBrowser(htmlContent: string, context: vscode.ExtensionContext): Promise<boolean> {
    try {
        // إنشاء مجلد temp إذا لم يكن موجوداً
        const tempDir = vscode.Uri.joinPath(context.globalStorageUri, 'temp');
        try {
            await vscode.workspace.fs.createDirectory(tempDir);
        } catch (error) {
            // المجلد موجود بالفعل أو تم إنشاؤه
        }
        
        // إنشاء ملف HTML مؤقت
        const timestamp = Date.now();
        const tempFileUri = vscode.Uri.joinPath(tempDir, `preview-${timestamp}.html`);
        
        // كتابة محتوى HTML إلى الملف
        await vscode.workspace.fs.writeFile(tempFileUri, Buffer.from(htmlContent, 'utf8'));
        
        // فتح الملف في المتصفح
        return await openHtmlInBrowser(tempFileUri);
    } catch (error) {
        vscode.window.showErrorMessage(t('messages.previewError', { error: String(error) }));
        return false;
    }
}

/**
 * معالجة أمر فتح المتصفح - فتح المحتوى الحالي من EditorPanel
 */
async function handleOpenBrowser(context: vscode.ExtensionContext): Promise<void> {
    const editorPanel = EditorPanel.getInstance();
    
    // التأكد من أن EditorPanel مفتوح
    if (!editorPanel) {
        vscode.window.showErrorMessage(MESSAGES.EDITOR_NOT_OPEN());
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
        vscode.window.showErrorMessage(MESSAGES.SAVE_FAILED());
        return;
    }

    // التحقق من وجود مسار محفوظ مسبقاً
    if (savedFilePath) {
        // حفظ مباشر إلى الملف المحفوظ
        await saveFileWithProgress(savedFilePath, code);
        
        // فتح الملف في المتصفح
        const success = await openHtmlInBrowser(savedFilePath);
        if (success) {
            vscode.window.showInformationMessage(t('messages.openedInBrowser'));
        }
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
        
        // فتح الملف في المتصفح
        const success = await openHtmlInBrowser(uri);
        if (success) {
            vscode.window.showInformationMessage(t('messages.openedInBrowser'));
        }
    }
}

/**
 * فتح ملف HTML من مساحة العمل في المتصفح
 * @param context - سياق الإضافة
 */
async function handleOpenWorkspaceFileInBrowser(context: vscode.ExtensionContext): Promise<void> {
    // الحصول على المحرر النشط
    const activeEditor = vscode.window.activeTextEditor;
    
    if (!activeEditor) {
        vscode.window.showErrorMessage(t('messages.noActiveEditor'));
        return;
    }

    // التأكد من أن الملف هو ملف HTML
    const fileName = activeEditor.document.fileName;
    if (!fileName.toLowerCase().endsWith('.html') && !fileName.toLowerCase().endsWith('.htm')) {
        vscode.window.showErrorMessage(t('messages.notHtmlFile'));
        return;
    }

    // إنشاء URI للملف
    const fileUri = vscode.Uri.file(fileName);
    
    // فتح الملف في المتصفح
    const success = await openHtmlInBrowser(fileUri);
    if (success) {
        vscode.window.showInformationMessage(t('messages.openedInBrowser'));
    }
}

/**
 * معالجة أمر فتح الإعدادات
 */
async function handleOpenSettings(context: vscode.ExtensionContext): Promise<void> {
    // استيراد SettingsPanel بشكل ديناميكي لتجنب الاعتماد الدائري
    const { SettingsPanel } = await import('../panels/settingsPanel');
    await SettingsPanel.create(context);
}
