import * as vscode from 'vscode';
import { EditorPanel } from '../panels/editorPanel';
import { WebPageBuilderPanel } from '../panels/webPageBuilderPanel';

/**
 * أوامر الإضافة
 */
const COMMANDS = {
    OPEN_BUILDER: 'webPageBuilder.openBuilder',
    UNDO: 'webPageBuilder.undo',
    REDO: 'webPageBuilder.redo',
    VIEW_SOURCE: 'webPageBuilder.viewSource',
    SAVE_AS: 'webPageBuilder.saveAs',
    OPEN_BUILD: 'webPageBuilder.openBuild',
    SETTINGS: 'webPageBuilder.settings',
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
            if (!editorPanel) {
                // إعادة فتح المحرر إذا كان مغلقاً
                editorPanel = await EditorPanel.create(context);
            }
            if (editorPanel) {
                editorPanel.reveal(vscode.ViewColumn.One);
            }
        }),

        vscode.commands.registerCommand(COMMANDS.SAVE_AS, async () => {
            await handleSaveAs();
        }),

        vscode.commands.registerCommand(COMMANDS.OPEN_BUILD, () => {
            vscode.window.showInformationMessage('فتح البناء...');
        }),

        vscode.commands.registerCommand(COMMANDS.SETTINGS, () => {
            vscode.window.showInformationMessage('الإعدادات...');
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
