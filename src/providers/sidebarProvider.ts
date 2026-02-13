import * as vscode from 'vscode';
import * as path from 'path';
import { readFile } from 'fs/promises';
import { EditorPanel } from '../panels/editorPanel';
import { resetSavedFilePath } from '../commands/index';

/**
 * رسائل Webview
 */
const WEBVIEW_MESSAGES = {
    OPEN_BUILDER: 'openBuilder',
    NEW_PROJECT: 'newProject',
    SAVE_AS: 'saveAs',
    INSERT_TAG: 'insertTag'
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
    'input': '<input value=""/>',
    'img': '<img src=""/>',
    'a': '<a href=""></a>',
    'link': '<link rel="stylesheet" href=""/>',
    'source': '<source src=""/>',
    'track': '<track src=""/>',
    'embed': '<embed src=""/>',
    'video': '<video src=""></video>',
    'audio': '<audio src=""></audio>',
    'iframe': '<iframe src=""></iframe>',
    'form': '<form action="" method=""></form>',
    'button': '<button type=""></button>',
    'meta': '<meta name="" content=""/>',
    'base': '<base href=""/>',
    'object': '<object data=""></object>',
};

/**
 * العناصر الخاصة المخصصة (روابط CSS و JavaScript)
 */
const SPECIAL_ELEMENTS: Record<string, string> = {
    'link-stylesheet': '<link rel="stylesheet" href="style.css">',
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
    'picture': { childTag: 'img', content: '' },
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
    'table': `<table>
    <thead>
        <tr>
            <th>عنوان 1</th>
            <th>عنوان 2</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>خلية 1</td>
            <td>خلية 2</td>
        </tr>
    </tbody>
</table>`,
};

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
    ): Promise<void> {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = await this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage((data) => {
            this.handleMessage(data);
        });
    }

    /**
     * معالج الرسائل من Webview
     */
    private handleMessage(data: any): void {
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
                // إدراج كود الوسم في مكان المؤشر في المحرر
                const editorPanel = EditorPanel.getInstance();
                if (editorPanel) {
                    const tag = data.tag;
                    const tagCode = this.generateTagCode(tag);
                    editorPanel.insertTextAtCursor(tagCode);
                }
                break;
        }
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
        
        // الوسم يحتاج إلى إغلاق
        return `<${tag}></${tag}>`;
    }

    /**
     * الحصول على محتوى HTML للـ Sidebar
     */
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
            return htmlContent
                .replace('<link rel="stylesheet" href="sidebar.css">', `<style>${cssContent}</style>`)
                .replace('<script src="sidebar.js"></script>', `<script>${jsContent}</script>`);
        } catch (error) {
            console.error('Error loading sidebar webview files:', error);
            return `<html><body><h1>Error loading sidebar</h1></body></html>`;
        }
    }
}
