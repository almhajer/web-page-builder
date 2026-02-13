import * as vscode from 'vscode';
import path from 'path';
import { codeEventEmitter } from '../events/codeEventEmitter';
import { t } from '../locales/localeService';

/**
 * إعدادات EditorPanel
 */
const EDITOR_CONFIG = {
    VIEW_TYPE: 'Editor',
    TITLE: 'Editor',
    MONACO_VERSION: '0.45.0',
    MONACO_CDN: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min',
    DEFAULT_HTML: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صفحتي</title>
</head>
<body>

</body>
</html>`
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
     * تنظيف طلب الكود المعلق
     */
    private clearPendingCodeRequest(): void {
        if (this.pendingCodeRequest) {
            this.pendingCodeRequest.resolver('');
            this.pendingCodeRequest = null;
        }
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
                localResourceRoots: []
            }
        );

        // تعيين محتوى HTML للـ webview
        panel.webview.html = getEditorHtml();

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
     * تراجع عن آخر تعديل
     */
    public undo(): void {
        this.panel.webview.postMessage({
            type: 'undo'
        });
    }

    /**
     * إعادة التعديل الملغي
     */
    public redo(): void {
        this.panel.webview.postMessage({
            type: 'redo'
        });
    }

    /**
     * طلب الكود من Webview عند إعادة تنشيط المحرر
     */
    private requestCodeFromWebviewOnActivate(): void {
        // استيراد WebPageBuilderPanel بشكل ديناميكي لتجنب الاعتماد الدائري
        const { WebPageBuilderPanel } = require('./webPageBuilderPanel');
        const webviewPanel = WebPageBuilderPanel.getInstance();
        if (webviewPanel) {
            webviewPanel.requestCodeFromWebview();
        }
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
                // طلب الكود من Webview عند إعادة تنشيط المحرر
                this.requestCodeFromWebviewOnActivate();
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
 * الحصول على محتوى HTML لمحرر 
 */
function getEditorHtml(): string {
    const defaultHtml = EDITOR_CONFIG.DEFAULT_HTML;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https:; style-src 'unsafe-inline' https:; font-src https:;">
    <style>
        body, html { 
            margin: 0; 
            padding: 0; 
            height: 100%; 
            overflow: hidden; 
            background-color: #1e1e1e; 
        }
        #container { 
            height: 100vh; 
            width: 100%; 
        }
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            color: #cccccc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div id="container">
        <div class="loading">جاري تحميل المحرر...</div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"></script>
    <script>
        const vscode = acquireVsCodeApi();
        let editor = null;
        const defaultHtml = ${JSON.stringify(defaultHtml)};

        // تهيئة المحرر
        require.config({ 
            paths: { 
                'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
            }
        });

        require(['vs/editor/editor.main'], function() {
            console.log('Monaco Editor loaded successfully');
            
            // إنشاء المحرر
            editor = monaco.editor.create(document.getElementById('container'), {
                value: defaultHtml,
                language: 'html',
                theme: 'vs-dark',
                automaticLayout: true,
                fontSize: 14,
                readOnly: false,
                minimap: { enabled: true },
                wordWrap: 'on',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                renderWhitespace: 'selection',
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                tabSize: 4,
                insertSpaces: true
            });

            console.log('Editor created:', editor !== null);
            console.log('Editor value:', editor.getValue().substring(0, 100));

            // إرسال الكود الأولي
            vscode.postMessage({
                type: 'updateCode',
                code: editor.getValue()
            });

            // إرسال التحديثات عند تغيير المحتوى
            editor.onDidChangeModelContent(function() {
                console.log('Content changed, sending update...');
                vscode.postMessage({
                    type: 'updateCode',
                    code: editor.getValue()
                });
            });

            // إزالة رسالة التحميل
            const loadingEl = document.querySelector('.loading');
            if (loadingEl) {
                loadingEl.remove();
            }
        });

        // معالجة الرسائل من الإضافة
        window.addEventListener('message', function(event) {
            const message = event.data;
            console.log('Webview received message:', message);

            if (!editor) {
                console.log('Editor not ready yet');
                return;
            }

            switch (message.type) {
                case 'updateEditorValue':
                    console.log('Updating editor value, length:', message.code ? message.code.length : 0);
                    editor.setValue(message.code || '');
                    break;
                    
                case 'requestCurrentCode':
                    console.log('Requesting current code');
                    vscode.postMessage({
                        type: 'updateCode',
                        code: editor.getValue(),
                        requestId: message.requestId
                    });
                    break;
                    
                case 'insertTextAtCursor':
                    console.log('Inserting text at cursor');
                    const position = editor.getPosition();
                    const text = message.text || '';
                    const model = editor.getModel();
                    const fullText = model.getValue();
                    
                    // تصنيف الوسوم حسب القسم التابع لها
                    const headElements = ['title', 'base', 'link', 'meta', 'style'];
                    const bodyElements = ['p', 'div', 'span', 'img', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                                          'button', 'input', 'textarea', 'select', 'form', 'label',
                                          'table', 'tr', 'td', 'th', 'ul', 'ol', 'li', 'article',
                                          'section', 'nav', 'aside', 'header', 'footer', 'main',
                                          'figure', 'figcaption', 'video', 'audio', 'canvas', 'iframe',
                                          'br', 'hr', 'pre', 'code', 'blockquote', 'address'];
                    
                    // التحقق مما إذا كان وسم script داخلي (بدون src)
                    const isInternalScript = text.includes('<script') && !text.includes('src="');
                    
                    // التحقق مما إذا كان وسم script خارجي (له src)
                    const isExternalScript = text.includes('src="') && text.includes('<script');
                    
                    // التحقق مما إذا كان المؤشر داخل head أو body
                    const cursorAbsolutePos = model.getOffsetAt(position);
                    const headStartMatch = fullText.match(/<head[^>]*>/i);
                    const headEndMatch = fullText.match(/<\\/head>/i);
                    const bodyStartMatch = fullText.match(/<body[^>]*>/i);
                    const bodyEndMatch = fullText.match(/<\\/body>/i);
                    
                    let isCursorInHead = false;
                    let isCursorInBody = false;
                    
                    if (headStartMatch && headEndMatch) {
                        const headStart = headStartMatch.index + headStartMatch[0].length;
                        const headEnd = headEndMatch.index;
                        isCursorInHead = cursorAbsolutePos >= headStart && cursorAbsolutePos <= headEnd;
                    }
                    
                    if (bodyStartMatch && bodyEndMatch) {
                        const bodyStart = bodyStartMatch.index + bodyStartMatch[0].length;
                        const bodyEnd = bodyEndMatch.index;
                        isCursorInBody = cursorAbsolutePos >= bodyStart && cursorAbsolutePos <= bodyEnd;
                    }
                    
                    // استخراج اسم الوسم من النص
                    const tagMatch = text.match(/^\\s*<(\\w+)/);
                    const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
                    
                    // التحقق مما إذا كان المؤشر داخل iframe
                    const beforeCursor = fullText.substring(0, cursorAbsolutePos);
                    const lastIframeOpen = beforeCursor.lastIndexOf('<iframe');
                    const lastIframeClose = beforeCursor.lastIndexOf('</iframe>');
                    const isInsideIframe = lastIframeOpen !== -1 && 
                                           (lastIframeClose === -1 || lastIframeOpen > lastIframeClose);
                    
                    // التحقق من الوسوم الأساسية
                    if ((tagName === 'html' || tagName === 'head' || tagName === 'body') && !isInsideIframe) {
                        const mainContent = fullText.replace(/<iframe[^>]*>[\\s\\S]*?<\\/iframe>/gi, '');
                        
                        let tagExists = false;
                        if (tagName === 'html') {
                            tagExists = /<html[^>]*>/i.test(mainContent);
                        } else if (tagName === 'head') {
                            tagExists = /<head[^>]*>/i.test(mainContent);
                        } else if (tagName === 'body') {
                            tagExists = /<body[^>]*>/i.test(mainContent);
                        }
                        
                        if (tagExists) {
                            vscode.postMessage({
                                type: 'showWarning',
                                message: t('messages.tagAlreadyExists', { tag: tagName })
                            });
                            return;
                        }
                    }
                    
                    // تحديد ما إذا كان عنصر head أو body
                    const isHeadElement = headElements.includes(tagName);
                    const isBodyElement = bodyElements.includes(tagName) || !isHeadElement;
                    
                    let insertPosition = position;
                    let textToInsert = text;
                    
                    // الحصول على السطر الحالي
                    const lineContent = model.getLineContent(position.lineNumber);
                    
                    // التحقق مما إذا كان المؤشر داخل وسم
                    const isInsideTag = lineContent.substring(0, position.column - 1).includes('<') &&
                                          !lineContent.substring(0, position.column - 1).includes('>');
                    
                    // التحقق مما إذا كان الوسم يحتاج إلى وضع المؤشر في المنتصف
                    // التعامل مع الوسوم العادية (مع أو بدون سمات)
                    const normalTagMatch = text.match(/^<([a-zA-Z][a-zA-Z0-9]*)([^>]*)><\\/\\1>$/);
                    // التعامل مع الوسوم الأحادية مع سمات
                    const selfClosingTagMatch = text.match(/^<([a-zA-Z][a-zA-Z0-9]*)([^>]*)\\/>$/);
                    
                    let cursorPositionAfterInsert = null;
                    let cursorOffset = 0; // إزاحة المؤشر داخل textToInsert
                    
                    if (normalTagMatch) {
                        // وسم عادي مع أو بدون سمات (مثل <a href=""></a> أو <h5></h5>)
                        // المؤشر يجب أن يكون بين > و <
                        const fullOpenTag = '<' + normalTagMatch[1] + normalTagMatch[2] + '>';
                        cursorOffset = fullOpenTag.length;
                    } else if (selfClosingTagMatch) {
                        // وسم أحادي مع سمات (مثل <img src="">)
                        // المؤشر يجب أن يكون داخل علامات الاقتباس للسمة الأولى الفارغة
                        const attributes = selfClosingTagMatch[2];
                        // البحث عن السمة الأولى ذات القيمة الفارغة (مع أو بدون مسافات حول =)
                        const emptyAttrMatch = attributes.match(/([a-zA-Z-]+)\\s*=\\s*""/);
                        if (emptyAttrMatch) {
                            // حساب موقع المؤشر داخل علامات الاقتباس
                            const beforeAttrIndex = text.indexOf(emptyAttrMatch[0]);
                            const attrNameLength = emptyAttrMatch[1].length;
                            // البحث عن موقع علامة الاقتباس المزدوجة الأولى
                            const quoteIndex = text.indexOf('""', beforeAttrIndex);
                            cursorOffset = quoteIndex + 1; // +1 للدخول داخل علامات الاقتباس
                        } else {
                            // إذا لم تكن هناك سمة فارغة، ضع المؤشر بعد وسم الفتح
                            const fullTag = '<' + selfClosingTagMatch[1] + selfClosingTagMatch[2] + '/>';
                            cursorOffset = fullTag.length;
                        }
                    }
                    
                    // معالجة وسم script (داخلي أو خارجي) حسب موقع المؤشر
                    if (isInternalScript || isExternalScript) {
                        if (isCursorInHead && headEndMatch) {
                            // إذا كان المؤشر في head، أضف السكربت في نهاية head
                            const headEndIndex = headEndMatch.index;
                            const headEndPosition = model.getPositionAt(headEndIndex);
                            
                            const headStartLine = model.getPositionAt(headStartMatch.index);
                            const headStartLineContent = model.getLineContent(headStartLine.lineNumber);
                            const baseIndent = headStartLineContent.match(/^\\s*/)[0] || '';
                            const indent = baseIndent + '    ';
                            
                            insertPosition = { lineNumber: headEndPosition.lineNumber, column: headEndPosition.column };
                            textToInsert = indent + text + '\\n';
                            
                            // تحديث موقع المؤشر بعد الإدراج
                            if (cursorPositionAfterInsert) {
                                cursorPositionAfterInsert = {
                                    lineNumber: insertPosition.lineNumber,
                                    column: insertPosition.column + indent.length + openTagLength
                                };
                            }
                        } else if (isCursorInBody && bodyStartMatch) {
                            // إذا كان المؤشر في body، أضف السكربت في بداية body
                            const bodyStartIndex = bodyStartMatch.index + bodyStartMatch[0].length;
                            const bodyStartPosition = model.getPositionAt(bodyStartIndex);
                            
                            const bodyStartLine = model.getPositionAt(bodyStartMatch.index);
                            const bodyStartLineContent = model.getLineContent(bodyStartLine.lineNumber);
                            const baseIndent = bodyStartLineContent.match(/^\\s*/)[0] || '';
                            const indent = baseIndent + '    ';
                            
                            insertPosition = { lineNumber: bodyStartPosition.lineNumber + 1, column: 1 };
                            textToInsert = '\\n' + indent + text + '\\n';
                            
                            // تحديث موقع المؤشر بعد الإدراج
                            if (cursorPositionAfterInsert) {
                                cursorPositionAfterInsert = {
                                    lineNumber: insertPosition.lineNumber,
                                    column: insertPosition.column + indent.length + openTagLength
                                };
                            }
                        } else if (bodyStartMatch) {
                            // إذا لم يكن المؤشر في head أو body، أضف السكربت في بداية body بشكل افتراضي
                            const bodyStartIndex = bodyStartMatch.index + bodyStartMatch[0].length;
                            const bodyStartPosition = model.getPositionAt(bodyStartIndex);
                            
                            const bodyStartLine = model.getPositionAt(bodyStartMatch.index);
                            const bodyStartLineContent = model.getLineContent(bodyStartLine.lineNumber);
                            const baseIndent = bodyStartLineContent.match(/^\\s*/)[0] || '';
                            const indent = baseIndent + '    ';
                            
                            insertPosition = { lineNumber: bodyStartPosition.lineNumber + 1, column: 1 };
                            textToInsert = '\\n' + indent + text + '\\n';
                            
                            // تحديث موقع المؤشر بعد الإدراج
                            if (cursorPositionAfterInsert) {
                                cursorPositionAfterInsert = {
                                    lineNumber: insertPosition.lineNumber,
                                    column: insertPosition.column + indent.length + openTagLength
                                };
                            }
                        }
                    }
                    else if (isHeadElement && headEndMatch) {
                        const headEndIndex = headEndMatch.index;
                        const headEndPosition = model.getPositionAt(headEndIndex);
                        
                        const headStartLine = model.getPositionAt(headStartMatch.index);
                        const headStartLineContent = model.getLineContent(headStartLine.lineNumber);
                        const baseIndent = headStartLineContent.match(/^\\s*/)[0] || '';
                        const indent = baseIndent + '    ';
                        
                        insertPosition = { lineNumber: headEndPosition.lineNumber, column: headEndPosition.column };
                        textToInsert = indent + text + '\\n';
                        
                        // تحديث موقع المؤشر بعد الإدراج
                        if (cursorPositionAfterInsert) {
                            cursorPositionAfterInsert = {
                                lineNumber: insertPosition.lineNumber,
                                column: insertPosition.column + indent.length + cursorOffset
                            };
                        }
                    } else if (isBodyElement && bodyStartMatch) {
                        const bodyStartIndex = bodyStartMatch.index + bodyStartMatch[0].length;
                        const bodyEndIndex = bodyEndMatch ? bodyEndMatch.index : fullText.length;
                        
                        let cursorAbsolutePosition = 0;
                        for (let i = 1; i < position.lineNumber; i++) {
                            cursorAbsolutePosition += model.getLineLength(i) + 1;
                        }
                        cursorAbsolutePosition += position.column - 1;
                        
                        const isCursorInBodyRange = cursorAbsolutePosition >= bodyStartIndex && 
                                                cursorAbsolutePosition <= bodyEndIndex;
                        
                        if (isCursorInBodyRange) {
                            insertPosition = position;
                            const currentLineWhitespace = lineContent.match(/^\\s*/)[0];
                            
                            if (!isInsideTag && lineContent.trim() !== '') {
                                textToInsert = '\\n' + currentLineWhitespace + text;
                                // تحديث موقع المؤشر بعد الإدراج
                                if (cursorPositionAfterInsert) {
                                    cursorPositionAfterInsert = {
                                        lineNumber: insertPosition.lineNumber + 1,
                                        column: currentLineWhitespace.length + cursorOffset
                                    };
                                }
                            } else if (lineContent.trim() === '') {
                                textToInsert = text;
                                // تحديث موقع المؤشر بعد الإدراج
                                if (cursorPositionAfterInsert) {
                                    cursorPositionAfterInsert = {
                                        lineNumber: insertPosition.lineNumber,
                                        column: cursorOffset
                                    };
                                }
                            }
                        } else {
                            if (bodyEndMatch) {
                                const bodyEndIndex = bodyEndMatch.index;
                                const bodyEndPosition = model.getPositionAt(bodyEndIndex);
                                
                                const bodyStartLine = model.getPositionAt(bodyStartMatch.index);
                                const bodyStartLineContent = model.getLineContent(bodyStartLine.lineNumber);
                                const baseIndent = bodyStartLineContent.match(/^\\s*/)[0] || '';
                                const indent = baseIndent + '    ';
                                
                                insertPosition = { lineNumber: bodyEndPosition.lineNumber, column: bodyEndPosition.column };
                                textToInsert = indent + text + '\\n';
                                
                                // تحديث موقع المؤشر بعد الإدراج
                                if (cursorPositionAfterInsert) {
                                    cursorPositionAfterInsert = {
                                        lineNumber: insertPosition.lineNumber,
                                        column: insertPosition.column + indent.length + cursorOffset
                                    };
                                }
                            } else {
                                const lastLine = model.getLineCount();
                                const lastColumn = model.getLineLength(lastLine) + 1;
                                insertPosition = { lineNumber: lastLine, column: lastColumn };
                                textToInsert = '\\n' + text;
                                
                                // تحديث موقع المؤشر بعد الإدراج
                                if (cursorPositionAfterInsert) {
                                    cursorPositionAfterInsert = {
                                        lineNumber: insertPosition.lineNumber,
                                        column: insertPosition.column + 1 + cursorOffset
                                    };
                                }
                            }
                        }
                    } else {
                        insertPosition = position;
                        const currentLineWhitespace = lineContent.match(/^\\s*/)[0];
                        
                        if (!isInsideTag && lineContent.trim() !== '') {
                            textToInsert = '\\n' + currentLineWhitespace + text;
                            // تحديث موقع المؤشر بعد الإدراج
                            if (cursorPositionAfterInsert) {
                                cursorPositionAfterInsert = {
                                    lineNumber: insertPosition.lineNumber + 1,
                                    column: currentLineWhitespace.length + cursorOffset
                                };
                            }
                        } else {
                            textToInsert = text;
                            // تحديث موقع المؤشر بعد الإدراج
                            if (cursorPositionAfterInsert) {
                                cursorPositionAfterInsert = {
                                    lineNumber: insertPosition.lineNumber,
                                    column: cursorOffset
                                };
                            }
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
                    
                    // وضع المؤشر في المنتصف إذا كان الوسم يحتاج إلى ذلك
                    if (cursorPositionAfterInsert) {
                        editor.setPosition(cursorPositionAfterInsert);
                        editor.focus();
                    }
                    break;
                    
                case 'undo':
                    editor.trigger('undo', 'undo', null);
                    break;
                    
                case 'redo':
                    editor.trigger('redo', 'redo', null);
                    break;
            }
        });

        // معالجة الأخطاء
        window.onerror = function(msg, url, lineNo, columnNo, error) {
            console.error('Error: ', msg, url, lineNo, columnNo, error);
            return false;
        };
    </script>
</body>
</html>`;
}
