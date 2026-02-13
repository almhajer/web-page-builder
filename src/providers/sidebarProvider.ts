import * as vscode from 'vscode';
import * as path from 'path';
import { readFile } from 'fs/promises';
import { EditorPanel } from '../panels/editorPanel';
import { resetSavedFilePath } from '../commands/index';
import { loadLocale, getLocale, t, LocaleKey } from '../locales/localeService';

/**
 * رسائل Webview
 */
const WEBVIEW_MESSAGES = {
    OPEN_BUILDER: 'openBuilder',
    NEW_PROJECT: 'newProject',
    SAVE_AS: 'saveAs',
    INSERT_TAG: 'insertTag',
    OPEN_SETTINGS: 'openSettings',
    CHANGE_LANGUAGE: 'changeLanguage',
    GET_LOCALE: 'getLocale',
    UPDATE_LOCALE: 'updateLocale'
} as const;

/**
 * الوسوم الأحادية (void elements) - لا تحتاج إلى إغلاق
 */
const VOID_TAGS = [
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
] as const;

/**
 * الوسوم التي تتطلب خصائص إلزامية
 */
const TAGS_WITH_REQUIRED_ATTRIBUTES: Record<string, string> = {
    'input': '<input value="">',
    'img': '<img src="">',
    'a': '<a href=""></a>',
    'link': '<link rel="stylesheet" href="">',
    'source': '<source src="">',
    'track': '<track src="">',
    'embed': '<embed src="">',
    'video': '<video src=""></video>',
    'audio': '<audio src=""></audio>',
    'iframe': '<iframe src=""></iframe>',
    'form': '<form action="" method=""></form>',
    'button': '<button type=""></button>',
    'meta': '<meta name="" content="">',
    'base': '<base href="">',
    'object': '<object data=""></object>',
};

/**
 * العناصر الخاصة المخصصة (روابط CSS و JavaScript)
 */
const SPECIAL_ELEMENTS: Record<string, string> = {
    'link-stylesheet': '<link rel="stylesheet" href="">',
    'script-src': '<script type="text/javascript" src=""></script>',
    'script-internal': '<script type="text/javascript">\n    \n</script>',
};

/**
 * الوسوم التي تتطلب عنصر ابن واحد على الأقل مع المحتوى الافتراضي
 */
const TAGS_WITH_REQUIRED_CHILDREN: Record<string, { childTag: string; content: string }> = {
    'select': { childTag: 'option', content: 'الخيار 1' },
    'ul': { childTag: 'li', content: 'عنصر' },
    'ol': { childTag: 'li', content: 'عنصر' },
    'tr': { childTag: 'td', content: 'خلية' },
    'thead': { childTag: 'tr', content: '' },
    'tbody': { childTag: 'tr', content: '' },
    'tfoot': { childTag: 'tr', content: '' },
    'dl': { childTag: 'dt', content: 'مصطلح' },
    'figure': { childTag: 'figcaption', content: 'وصف الصورة' },
    'video': { childTag: 'source', content: '' },
    'audio': { childTag: 'source', content: '' },
    'nav': { childTag: 'a', content: 'رابط' },
    'menu': { childTag: 'li', content: 'عنصر' },
    'optgroup': { childTag: 'option', content: 'خيار' },
    'fieldset': { childTag: 'legend', content: 'عنوان' },
    'details': { childTag: 'summary', content: 'ملخص' },
};

/**
 * الوسوم التي تتطلب هيكل معقد (محتوى مخصص)
 */
const TAGS_WITH_COMPLEX_STRUCTURE: Record<string, string> = {
    'picture': `<picture>
    <img src=""/>
</picture>`,
    'table': `<table>
    <thead>
        <tr>
            <th>عنوان 1</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>خلية 1</td>
        </tr>
    </tbody>
</table>`,
};

/**
 * WebPageBuilderSidebarProvider - موفر Sidebar View
 */
export class WebPageBuilderSidebarProvider implements vscode.WebviewViewProvider {
    private static instance: WebPageBuilderSidebarProvider | null = null;
    private _view?: vscode.WebviewView;
    private _context?: vscode.ExtensionContext;

    constructor(private readonly _extensionUri: vscode.Uri) {}
    
    /**
     * الحصول على المثيل الحالي
     */
    public static getInstance(): WebPageBuilderSidebarProvider | null {
        return WebPageBuilderSidebarProvider.instance;
    }
    
    /**
     * تعيين سياق الإضافة
     */
    public setContext(context: vscode.ExtensionContext): void {
        this._context = context;
    }

    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): Promise<void> {
        this._view = webviewView;
        WebPageBuilderSidebarProvider.instance = this;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = await this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage((data) => {
            this.handleMessage(data);
        });
        
        // إرسال الترجمات عند تحميل الـ webview
        this.sendLocaleToWebview();
    }

    /**
     * معالج الرسائل من Webview
     */
    private async handleMessage(data: { type: string; tag?: string; language?: LocaleKey }): Promise<void> {
        console.log('Sidebar received message:', data);
        
        switch (data.type) {
            case WEBVIEW_MESSAGES.OPEN_BUILDER:
                vscode.window.showInformationMessage('Opening Web Page Builder...');
                break;
            case WEBVIEW_MESSAGES.NEW_PROJECT:
                // إعادة تعيين مسار الملف المحفوظ عند إنشاء مشروع جديد
                resetSavedFilePath();
                vscode.window.showInformationMessage('Creating new project...');
                break;
            case WEBVIEW_MESSAGES.SAVE_AS:
                vscode.window.showInformationMessage('Saving as...');
                break;
            case WEBVIEW_MESSAGES.INSERT_TAG:
                console.log('INSERT_TAG received, tag:', data.tag);
                // إدراج كود الوسم في مكان المؤشر في المحرر
                let editorPanel = EditorPanel.getInstance();
                console.log('EditorPanel instance:', editorPanel ? 'exists' : 'null');
                
                if (!editorPanel && this._context) {
                    console.log('Creating new EditorPanel...');
                    // إعادة فتح المحرر إذا كان مغلقاً
                    await EditorPanel.create(this._context);
                    editorPanel = EditorPanel.getInstance();
                }
                
                if (editorPanel) {
                    const tag = data.tag;
                    if (!tag) {
                        vscode.window.showErrorMessage(t('messages.tagNotSelected'));
                        return;
                    }
                    const tagCode = this.generateTagCode(tag);
                    console.log('Generated tag code:', tagCode);
                    editorPanel.reveal(vscode.ViewColumn.One);
                    editorPanel.insertTextAtCursor(tagCode);
                    vscode.window.showInformationMessage(t('messages.tagInserted', { tag }));
                } else {
                    vscode.window.showErrorMessage(t('messages.editorNotAvailable'));
                }
                break;
            case WEBVIEW_MESSAGES.OPEN_SETTINGS:
                // فتح إعدادات الإضافة
                vscode.commands.executeCommand('workbench.action.openSettings', 'webPageBuilder');
                break;
            case WEBVIEW_MESSAGES.CHANGE_LANGUAGE:
                // تغيير اللغة
                await this.changeLanguage(data.language as LocaleKey);
                break;
            case WEBVIEW_MESSAGES.GET_LOCALE:
                // إرسال الترجمات للـ webview
                this.sendLocaleToWebview();
                break;
            case WEBVIEW_MESSAGES.UPDATE_LOCALE:
                // تحديث الترجمات من صفحة الإعدادات
                this.sendLocaleToWebview();
                break;
        }
    }

    /**
     * تغيير لغة الإضافة
     */
    private async changeLanguage(language: LocaleKey): Promise<void> {
        const config = vscode.workspace.getConfiguration('webPageBuilder');
        await config.update('language', language, vscode.ConfigurationTarget.Global);
        
        // إعادة تحميل الترجمات
        loadLocale(language);
        
        // إرسال الترجمات الجديدة للـ webview
        this.sendLocaleToWebview();
        
        // إظهار رسالة نجاح
        const message = language === 'ar'
            ? t('messages.success')
            : t('messages.success');
        vscode.window.showInformationMessage(message);
    }

    /**
     * إرسال الترجمات للـ webview
     */
    private sendLocaleToWebview(): void {
        if (this._view) {
            const localeKey = getLocale();
            const localeData = loadLocale(localeKey);
            this._view.webview.postMessage({
                type: 'localeUpdate',
                locale: localeKey,
                strings: localeData
            });
        }
    }

    /**
     * تحديث الترجمات (طريقة عامة)
     */
    public updateLocale(): void {
        this.sendLocaleToWebview();
    }

    /**
     * توليد كود الوسم
     * @param tag اسم الوسم
     * @returns كود الوسم
     */
    private generateTagCode(tag: string): string {
        // التحقق أولاً مما إذا كان عنصر خاص مخصص
        const specialElement = SPECIAL_ELEMENTS[tag];
        if (specialElement) {
            return specialElement;
        }
        
        // التحقق مما إذا كان الوسم له خصائص إلزامية
        const requiredAttributes = TAGS_WITH_REQUIRED_ATTRIBUTES[tag];
        if (requiredAttributes) {
            return requiredAttributes;
        }
        
        // التحقق مما إذا كان الوسم له هيكل معقد مخصص
        const complexStructure = TAGS_WITH_COMPLEX_STRUCTURE[tag];
        if (complexStructure) {
            return complexStructure;
        }
        
        // التحقق مما إذا كان الوسم يتطلب عنصر ابن افتراضي
        const childConfig = TAGS_WITH_REQUIRED_CHILDREN[tag];
        if (childConfig) {
            const { childTag, content } = childConfig;
            // التحقق مما إذا كان الوسم الابن له خصائص إلزامية
            const childRequiredAttributes = TAGS_WITH_REQUIRED_ATTRIBUTES[childTag];
            if (childRequiredAttributes) {
                return `<${tag}>\n    ${childRequiredAttributes}\n</${tag}>`;
            }
            // التحقق مما إذا كان الوسم الابن أحادي
            if (VOID_TAGS.includes(childTag as any)) {
                return `<${tag}>\n    <${childTag}/>\n</${tag}>`;
            }
            // إذا كان هناك محتوى نصي
            if (content) {
                return `<${tag}>\n    <${childTag}>${content}</${childTag}>\n</${tag}>`;
            }
            // بدون محتوى نصي
            return `<${tag}>\n    <${childTag}></${childTag}>\n</${tag}>`;
        }
        
        // التحقق مما إذا كان الوسم أحادي
        if (VOID_TAGS.includes(tag as any)) {
            return `<${tag}/>`;
        }
        
        // الوسم يحتاج إلى إغلاق - التأكد من أن الوسم يبدأ بحرف أبجدي
        if (/^[a-zA-Z]/.test(tag)) {
            return `<${tag}></${tag}>`;
        }
        
        // في حالة الوسم غير صالح، إرجاع وسم div افتراضي
        return `<div></div>`;
    }

    /**
     * الحصول على محتوى HTML للـ Sidebar
     */
    private async _getHtmlForWebview(webview: vscode.Webview): Promise<string> {
        try {
            // استخدام vscode.Uri.joinPath للحصول على URIs صحيحة تعمل في جميع البيئات
            const htmlUri = vscode.Uri.joinPath(this._extensionUri, 'out', 'webviews', 'sidebarWebview.html');
            const cssUri = vscode.Uri.joinPath(this._extensionUri, 'out', 'webviews', 'sidebar.css');
            const jsUri = vscode.Uri.joinPath(this._extensionUri, 'out', 'webviews', 'sidebar.js');
            
            const [htmlData, cssData, jsData] = await Promise.all([
                vscode.workspace.fs.readFile(htmlUri),
                vscode.workspace.fs.readFile(cssUri),
                vscode.workspace.fs.readFile(jsUri)
            ]);
            
            // تحويل Uint8Array إلى نص باستخدام TextDecoder
            const decoder = new TextDecoder('utf-8');
            const htmlContent = decoder.decode(htmlData);
            const cssContent = decoder.decode(cssData);
            const jsContent = decoder.decode(jsData);
            
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
