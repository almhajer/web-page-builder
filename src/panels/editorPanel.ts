import * as vscode from 'vscode';
import path from 'path';
import { codeEventEmitter } from '../events/codeEventEmitter';

/**
 * إعدادات EditorPanel
 */
const EDITOR_CONFIG = {
    VIEW_TYPE: 'Editor',
    TITLE: 'Editor',
    MONACO_VERSION: '0.34.1',
    MONACO_CDN: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor',
    DEFAULT_HTML: `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صفحة</title>
</head>
<body>

</body>
</html>`,
    EDITOR_OPTIONS: {
        language: 'html',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        suggestOnTriggerCharacters: true
    } as const
} as const;

/**
 * رسائل Webview
 */
const WEBVIEW_MESSAGES = {
    UPDATE_EDITOR_VALUE: 'updateEditorValue',
    REQUEST_CURRENT_CODE: 'requestCurrentCode',
    REQUEST_CODE_FROM_WEBVIEW: 'requestCurrentCodeFromWebview',
    UPDATE_CODE: 'updateCode',
    INSERT_TEXT_AT_CURSOR: 'insertTextAtCursor'
} as const;

/**
 * فئة EditorPanel لإدارة لوحة المحرر
 * تستخدم نمط Singleton لضمان وجود مثيل واحد فقط
 */
export class EditorPanel {
    private static instance: EditorPanel | null = null;
    private panel: vscode.WebviewPanel;
    private pendingCodeRequest: { requestId: string; resolver: (code: string) => void } | null = null;

    private constructor(panel: vscode.WebviewPanel) {
        this.panel = panel;
        this.setupEventHandlers();
    }

    /**
     * الحصول على المثيل الحالي
     */
    public static getInstance(): EditorPanel | null {
        return EditorPanel.instance;
    }

    /**
     * إنشاء EditorPanel جديد
     */
    public static async create(context: vscode.ExtensionContext): Promise<EditorPanel> {
        if (EditorPanel.instance) {
            return EditorPanel.instance;
        }

        const panel = vscode.window.createWebviewPanel(
            EDITOR_CONFIG.VIEW_TYPE,
            EDITOR_CONFIG.TITLE,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
            }
        );

        // تعيين محتوى HTML للـ webview
        panel.webview.html = await getEditorHtml();

        EditorPanel.instance = new EditorPanel(panel);
        return EditorPanel.instance;
    }

    /**
     * الحصول على WebviewPanel
     */
    public getWebviewPanel(): vscode.WebviewPanel {
        return this.panel;
    }

    /**
     * إظهار اللوحة
     */
    public reveal(column?: vscode.ViewColumn): void {
        this.panel.reveal(column);
    }

    /**
     * طلب الكود من المحرر مع إعادة المحاولة
     */
    public async requestCodeWithRetry(attempt: number, maxAttempts: number): Promise<string> {
        const requestId = `${Date.now()}-${attempt}`;

        return new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingCodeRequest = null;
                reject(new Error('Timeout'));
            }, 15000); // مهلة 15 ثانية

            this.pendingCodeRequest = {
                requestId: requestId,
                resolver: (receivedCode: string) => {
                    clearTimeout(timeout);
                    resolve(receivedCode);
                }
            };

            // إرسال الطلب للـ Webview للحصول على الكود الحالي
            this.panel.webview.postMessage({
                type: WEBVIEW_MESSAGES.REQUEST_CURRENT_CODE,
                requestId: requestId
            });
        });
    }

    /**
     * تحديث قيمة المحرر
     */
    public updateValue(code: string): void {
        this.panel.webview.postMessage({
            type: WEBVIEW_MESSAGES.UPDATE_EDITOR_VALUE,
            code: code
        });
    }

    /**
     * إدراج نص في مكان المؤشر
     */
    public insertTextAtCursor(text: string): void {
        this.panel.webview.postMessage({
            type: WEBVIEW_MESSAGES.INSERT_TEXT_AT_CURSOR,
            text: text
        });
    }

    /**
     * طلب الكود الحالي
     */
    public requestCurrentCode(): void {
        const requestId = Date.now().toString();
        this.panel.webview.postMessage({
            type: WEBVIEW_MESSAGES.REQUEST_CURRENT_CODE,
            requestId: requestId
        });
    }

    /**
     * إعداد معالجات الأحداث
     */
    private setupEventHandlers(): void {
        // معالج حدث إغلاق اللوحة
        this.panel.onDidDispose(() => {
            console.log('Editor panel was closed');
            EditorPanel.instance = null;
        });

        // معالج حدث تغيير حالة العرض
        this.panel.onDidChangeViewState(() => {
            if (this.panel.visible) {
                console.log('Editor panel activated');
            }
        });

        // معالج رسائل من EditorPanel
        this.panel.webview.onDidReceiveMessage(async (message) => {
            console.log('Extension received message from EditorPanel:', message);
            console.log('Pending request:', this.pendingCodeRequest ? this.pendingCodeRequest.requestId : 'none');
            
            switch (message.type) {
                case WEBVIEW_MESSAGES.UPDATE_CODE:
                    // التحقق من وجود طلب كود معلق مع requestId مطابق
                    if (this.pendingCodeRequest && message.requestId === this.pendingCodeRequest.requestId) {
                        console.log('Match found! Resolving promise with code...');
                        const { resolver } = this.pendingCodeRequest;
                        this.pendingCodeRequest = null;
                        resolver(message.code);
                    }
                    // إرسال الكود عبر نظام الأحداث لتحديث المعاينة في WebPageBuilderPanel
                    if (message.code) {
                        codeEventEmitter.emitCodeChange(message.code);
                    }
                    break;
                case WEBVIEW_MESSAGES.REQUEST_CODE_FROM_WEBVIEW:
                    // سيتم التعامل مع هذا في WebPageBuilderPanel
                    break;
                case 'showWarning':
                    // إظهار رسالة تحذير للمستخدم
                    vscode.window.showWarningMessage(message.message);
                    break;
            }
        });
    }
}

/**
 * الحصول على محتوى HTML لمحرر Monaco
 */
async function getEditorHtml(): Promise<string> {
    const monacoLoaderUrl = `${EDITOR_CONFIG.MONACO_CDN}/${EDITOR_CONFIG.MONACO_VERSION}/min/vs/loader.min.js`;
    const monacoPath = `${EDITOR_CONFIG.MONACO_CDN}/${EDITOR_CONFIG.MONACO_VERSION}/min/vs`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <script src="${monacoLoaderUrl}"></script>
    <style>
        body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background-color: #1e1e1e; }
        #container { height: 100vh; width: 100%; }
    </style>
</head>
<body>
    <div id="container"></div>

    <script>
        const vscode = acquireVsCodeApi();
        let editor = null;

        window.addEventListener('message', event => {
            const message = event.data;
            console.log('Webview received message:', message);
            console.log('Editor exists:', editor !== null);

            switch (message.type) {
                case '${WEBVIEW_MESSAGES.UPDATE_EDITOR_VALUE}':
                    if (editor) {
                        editor.setValue(message.code);
                    }
                    break;
                case '${WEBVIEW_MESSAGES.REQUEST_CURRENT_CODE}':
                    if (editor) {
                        const code = editor.getValue();
                        console.log('Sending code to extension, length:', code.length);
                        vscode.postMessage({
                            type: '${WEBVIEW_MESSAGES.UPDATE_CODE}',
                            code: code,
                            requestId: message.requestId
                        });
                    }
                    break;
                case '${WEBVIEW_MESSAGES.REQUEST_CODE_FROM_WEBVIEW}':
                    vscode.postMessage({
                        type: '${WEBVIEW_MESSAGES.REQUEST_CODE_FROM_WEBVIEW}'
                    });
                    break;
                case '${WEBVIEW_MESSAGES.INSERT_TEXT_AT_CURSOR}':
                    if (editor) {
                        const position = editor.getPosition();
                        const text = message.text || '';
                        const model = editor.getModel();
                        const fullText = model.getValue();
                        
                        // تصنيف الوسوم حسب القسم التابع لها
                        const headElements = ['title', 'base', 'link', 'meta', 'style', 'script'];
                        const bodyElements = ['p', 'div', 'span', 'img', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                                              'button', 'input', 'textarea', 'select', 'form', 'label', 
                                              'table', 'tr', 'td', 'th', 'ul', 'ol', 'li', 'article', 
                                              'section', 'nav', 'aside', 'header', 'footer', 'main', 
                                              'figure', 'figcaption', 'video', 'audio', 'canvas', 'iframe',
                                              'br', 'hr', 'pre', 'code', 'blockquote', 'address'];
                        
                        // الوسوم الأساسية التي يجب التحقق منها (لا يمكن تكرارها إلا داخل iframe)
                        const uniqueTags = ['html', 'head', 'body', 'title'];
                        
                        // استخراج اسم الوسم من النص
                        const tagMatch = text.match(/^\\s*<(\\w+)/);
                        const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
                        
                        // التحقق مما إذا كان المؤشر داخل iframe
                        // البحث عن أقرب وسم iframe يحتوي على المؤشر
                        const cursorAbsolutePos = model.getOffsetAt(position);
                        const beforeCursor = fullText.substring(0, cursorAbsolutePos);
                        const afterCursor = fullText.substring(cursorAbsolutePos);
                        
                        // البحث عن آخر فتح لـ iframe قبل المؤشر
                        const lastIframeOpen = beforeCursor.lastIndexOf('<iframe');
                        // البحث عن آخر إغلاق لـ iframe قبل المؤشر
                        const lastIframeClose = beforeCursor.lastIndexOf('</iframe>');
                        
                        // التحقق مما إذا كان المؤشر داخل iframe
                        const isInsideIframe = lastIframeOpen !== -1 && 
                                               (lastIframeClose === -1 || lastIframeOpen > lastIframeClose);
                        
                        // التحقق من الوسوم الأساسية
                        if (uniqueTags.includes(tagName) && !isInsideIframe) {
                            // البحث عن الوسم في المستوى الرئيسي (خارج أي iframe)
                            // نبحث عن الوسم خارج أي أطر iframe
                            let tagExists = false;
                            
                            // إزالة محتوى iframe للبحث في المستوى الرئيسي فقط
                            const mainContent = fullText.replace(/<iframe[^>]*>[\\s\\S]*?<\\/iframe>/gi, '');
                            
                            if (tagName === 'html') {
                                tagExists = /<html[^>]*>/i.test(mainContent);
                            } else if (tagName === 'head') {
                                tagExists = /<head[^>]*>/i.test(mainContent);
                            } else if (tagName === 'body') {
                                tagExists = /<body[^>]*>/i.test(mainContent);
                            } else if (tagName === 'title') {
                                tagExists = /<title[^>]*>/i.test(mainContent);
                            }
                            
                            if (tagExists) {
                                // إظهار رسالة للمستخدم بأن الوسم موجود مسبقاً
                                vscode.postMessage({
                                    type: 'showWarning',
                                    message: 'الوسم <' + tagName + '> موجود مسبقاً في المستند'
                                });
                                return; // عدم إدراج الوسم
                            }
                        }
                        
                        // تحديد ما إذا كان عنصر head أو body
                        const isHeadElement = headElements.includes(tagName);
                        const isBodyElement = bodyElements.includes(tagName) || !isHeadElement;
                        
                        // البحث عن مواضع الأقسام
                        const headStartMatch = fullText.match(/<head[^>]*>/i);
                        const headEndMatch = fullText.match(/<\\/head>/i);
                        const bodyStartMatch = fullText.match(/<body[^>]*>/i);
                        const bodyEndMatch = fullText.match(/<\\/body>/i);
                        
                        let insertPosition = position;
                        let textToInsert = text;
                        
                        // الحصول على السطر الحالي
                        const lineContent = model.getLineContent(position.lineNumber);
                        
                        // التحقق مما إذا كان المؤشر داخل وسم
                        const isInsideTag = lineContent.substring(0, position.column - 1).includes('<') && 
                                              !lineContent.substring(0, position.column - 1).includes('>');
                        
                        if (isHeadElement && headEndMatch) {
                            // إدراج عناصر الترويسة داخل وسم <head> في نهاية القسم
                            const headEndIndex = headEndMatch.index;
                            const headEndPosition = model.getPositionAt(headEndIndex);
                            
                            // حساب المسافة البادئة - مستوى واحد أكثر من الوسم الحاوي
                            const headStartLine = model.getPositionAt(headStartMatch.index);
                            const headStartLineContent = model.getLineContent(headStartLine.lineNumber);
                            const baseIndent = headStartLineContent.match(/^\\s*/)[0] || '';
                            const indent = baseIndent + '    '; // إضافة 4 مسافات للمستوى الداخلي
                            
                            insertPosition = { lineNumber: headEndPosition.lineNumber, column: headEndPosition.column };
                            textToInsert = indent + text + '\\n';
                            
                        } else if (isBodyElement && bodyStartMatch) {
                            // إدراج عناصر body داخل وسم <body> في موضع المؤشر الحالي
                            // التحقق مما إذا كان المؤشر داخل وسم <body>
                            const bodyStartIndex = bodyStartMatch.index + bodyStartMatch[0].length;
                            const bodyEndIndex = bodyEndMatch ? bodyEndMatch.index : fullText.length;
                            
                            // حساب موقع المؤشر بالنسبة للنص الكامل
                            let cursorAbsolutePosition = 0;
                            for (let i = 1; i < position.lineNumber; i++) {
                                cursorAbsolutePosition += model.getLineLength(i) + 1;
                            }
                            cursorAbsolutePosition += position.column - 1;
                            
                            // التحقق مما إذا كان المؤشر داخل <body>
                            const isCursorInBody = cursorAbsolutePosition >= bodyStartIndex && 
                                                    cursorAbsolutePosition <= bodyEndIndex;
                            
                            if (isCursorInBody) {
                                // المؤشر داخل body - إدراج في موضع المؤشر الحالي
                                insertPosition = position;
                                
                                // حساب المسافة البادئة للسطر الحالي
                                const currentLineWhitespace = lineContent.match(/^\\s*/)[0];
                                
                                // إدارة الأسطر الجديدة مع الحفاظ على التنسيق
                                if (!isInsideTag && lineContent.trim() !== '') {
                                    textToInsert = '\\n' + currentLineWhitespace + text;
                                } else if (lineContent.trim() === '') {
                                    // السطر فارغ - استخدام المسافة البادئة الحالية
                                    textToInsert = text;
                                }
                            } else {
                                // المؤشر خارج body - إدراج في نهاية body (قبل </body>)
                                if (bodyEndMatch) {
                                    const bodyEndIndex = bodyEndMatch.index;
                                    const bodyEndPosition = model.getPositionAt(bodyEndIndex);
                                    
                                    // حساب المسافة البادئة - مستوى واحد أكثر من الوسم الحاوي
                                    const bodyStartLine = model.getPositionAt(bodyStartMatch.index);
                                    const bodyStartLineContent = model.getLineContent(bodyStartLine.lineNumber);
                                    const baseIndent = bodyStartLineContent.match(/^\\s*/)[0] || '';
                                    const indent = baseIndent + '    '; // إضافة 4 مسافات للمستوى الداخلي
                                    
                                    insertPosition = { lineNumber: bodyEndPosition.lineNumber, column: bodyEndPosition.column };
                                    textToInsert = indent + text + '\\n';
                                } else {
                                    // لا يوجد وسم </body> - إدراج في نهاية الملف
                                    const lastLine = model.getLineCount();
                                    const lastColumn = model.getLineLength(lastLine) + 1;
                                    insertPosition = { lineNumber: lastLine, column: lastColumn };
                                    textToInsert = '\\n' + text;
                                }
                            }
                        } else {
                            // سلوك افتراضي - إدراج في موضع المؤشر
                            insertPosition = position;
                            
                            // حساب المسافة البادئة للسطر الحالي
                            const currentLineWhitespace = lineContent.match(/^\\s*/)[0];
                            
                            if (!isInsideTag && lineContent.trim() !== '') {
                                textToInsert = '\\n' + currentLineWhitespace + text;
                            }
                        }
                        
                        editor.executeEdits('', [{
                            range: {
                                startLineNumber: insertPosition.lineNumber,
                                startColumn: insertPosition.column,
                                endLineNumber: insertPosition.lineNumber,
                                endColumn: insertPosition.column
                            },
                            text: textToInsert
                        }]);
                    }
                    break;
            }
        });

        require.config({ paths: { 'vs': '${monacoPath}' }});

        require(['vs/editor/editor.main'], function() {
            editor = monaco.editor.create(document.getElementById('container'), {
                value: \`${EDITOR_CONFIG.DEFAULT_HTML}\`,
                language: '${EDITOR_CONFIG.EDITOR_OPTIONS.language}',
                theme: '${EDITOR_CONFIG.EDITOR_OPTIONS.theme}',
                automaticLayout: ${EDITOR_CONFIG.EDITOR_OPTIONS.automaticLayout},
                fontSize: ${EDITOR_CONFIG.EDITOR_OPTIONS.fontSize},
                suggestOnTriggerCharacters: ${EDITOR_CONFIG.EDITOR_OPTIONS.suggestOnTriggerCharacters}
            });

            // إرسال الكود الأولي فقط عند تحميل المحرر
            vscode.postMessage({
                type: '${WEBVIEW_MESSAGES.UPDATE_CODE}',
                code: editor.getValue()
            });
        });
    </script>
</body>
</html>`;
}
