import path from 'path';
import * as vscode from 'vscode';

// متغير عام لـ EditorPanel للوصول إليه من WebPageBuilderPanel
let EditorPanel: vscode.WebviewPanel;

export function activate(context: vscode.ExtensionContext) {
    // إنشاء وعرض Editor WebviewPanel مباشرة عند تفعيل الإضافة
    EditorPanel = vscode.window.createWebviewPanel(
        'Editor',
        'Editor',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
        }
    );

    // تعيين محتوى HTML للـ webview - محرر Monaco مع كود HTML فارغ
    EditorPanel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs/loader.min.js"></script>
    <style>
        body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background-color: #1e1e1e; }
        #container { height: 100vh; width: 100%; }
    </style>
</head>
<body>
    <div id="container"></div>

    <script>
        // إعداد موناكو
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs' }});

        require(['vs/editor/editor.main'], function() {
            window.editor = monaco.editor.create(document.getElementById('container'), {
                // كود HTML فارغ كقيمة افتراضية
                value: \`<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صفحة</title>
</head>
<body>

</body>
</html>\`,
                language: 'html',
                theme: 'vs-dark',
                automaticLayout: true,
                fontSize: 14,
                suggestOnTriggerCharacters: true
            });

            // إرسال الكود إلى Extension عند التغيير
            window.editor.onDidChangeModelContent(() => {
                const vscodeApi = acquireVsCodeApi();
                vscodeApi.postMessage({
                    type: 'updateCode',
                    code: window.editor.getValue()
                });
            });

            // إرسال الكود الأولي عند تحميل المحرر
            const vscodeApi = acquireVsCodeApi();
            vscodeApi.postMessage({
                type: 'updateCode',
                code: window.editor.getValue()
            });

            // الاستماع للرسائل من Extension
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.type) {
                    case 'updateEditorValue':
                        window.editor.setValue(message.code);
                        break;
                    case 'requestCurrentCode':
                        const vscodeApi = acquireVsCodeApi();
                        vscodeApi.postMessage({
                            type: 'updateCode',
                            code: window.editor.getValue()
                        });
                        break;
                }
            });
        });
    </script>
</body>
</html>`;

    // معالج حدث إغلاق اللوحة
    EditorPanel.onDidDispose(() => {
        console.log('Editor panel was closed');
    });

    // معالج رسائل من EditorPanel - تمرير الرسائل إلى WebPageBuilderPanel
    EditorPanel.webview.onDidReceiveMessage(
        message => {
            switch (message.type) {
                case 'updateCode':
                    if (WebPageBuilderPanel.currentPanel) {
                        WebPageBuilderPanel.currentPanel.updateCode(message.code);
                    }
                    break;
                case 'updateEditor':
                    EditorPanel.webview.postMessage({
                        type: 'updateEditorValue',
                        code: message.code
                    });
                    break;
            }
        },
        undefined,
        context.subscriptions
    );

    // فتح Webviews مباشرة عند تفعيل الإضافة
    WebPageBuilderPanel.createOrShow(context.extensionUri);

    // تسجيل أمر فتح البناء
    const openBuilderCommand = vscode.commands.registerCommand('webPageBuilder.openBuilder', () => {
        vscode.window.showInformationMessage('Web Page Builder is ready to use!');
    });

    // تسجيل أمر التحديث
    const refreshCommand = vscode.commands.registerCommand('webPageBuilder.refresh', () => {
        vscode.window.showInformationMessage('Web Page Builder refreshed!');
    });

    // تسجيل أمر إنشاء مشروع جديد
    const newProjectCommand = vscode.commands.registerCommand('webPageBuilder.newProject', () => {
        vscode.window.showInformationMessage('إنشاء مشروع جديد...');
    });

    // تسجيل أمر فتح ملف المصادر
    const openSourceCommand = vscode.commands.registerCommand('webPageBuilder.openSource', () => {
        vscode.window.showInformationMessage('فتح ملف المصادر...');
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

    // تسجيل عرض السايد بار
    const sidebarProvider = new WebPageBuilderSidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('webPageBuilder.sidebar', sidebarProvider)
    );

    context.subscriptions.push(
        openBuilderCommand,
        refreshCommand,
        newProjectCommand,
        openSourceCommand,
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

export function deactivate() {
    console.log('Web Page Builder extension is now deactivated!');
}

class WebPageBuilderSidebarProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage((data) => {
            switch (data.type) {
                case 'openBuilder':
                    vscode.window.showInformationMessage('Opening Web Page Builder...');
                    break;
                case 'newProject':
                    vscode.window.showInformationMessage('Creating new project...');
                    break;
                case 'openSource':
                    vscode.window.showInformationMessage('Opening source files...');
                    break;
                case 'insertTag':
                    vscode.window.showInformationMessage(`<${data.tag}>`);
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Page Builder</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #1e1e1e;
            color: #cccccc;
            padding: 4px;
            overflow-x: hidden;
        }
        
        .category {
            margin-bottom: 16px;
        }
        
        .category-title {
            font-size: 12px;
            font-weight: bold;
            color: #888888;
            margin-bottom: 8px;
            padding: 4px 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: center;
        }
        
        .separator {
            height: 1px;
            background-color: #3d3d3d;
            margin: 20px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            cursor: pointer;
            user-select: none;
            transition: all 0.3s ease;
            z-index: 10;
        }
        
        .separator:hover {
            background-color: #4d4d4d;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            animation: flashLine 0.5s ease;
        }
        
        @keyframes flashLine {
            0%, 100% { background-color: #4d4d4d; }
            50% { background-color: #888888; }
        }
        
        .separator-text {
            position: absolute;
            background-color: #1e1e1e;
            padding: 0 8px;
            color: #888888;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: all 0.3s ease;
            border-radius: 4px;
        }
        
        .separator-text:hover {
            color: #ffffff;
            background-color: rgba(45, 45, 45, 0.8);
            backdrop-filter: blur(8px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), 
                        0 0 15px rgba(0, 198, 255, 0.5), 
                        0 0 0 2px rgba(255, 255, 255, 0.1);
            filter: brightness(1.2);
            transform: scale(1.05);
        }
        
        .separator:hover .separator-text {
            background-color: rgba(45, 45, 45, 0.8);
            backdrop-filter: blur(8px);
            color: #ffffff;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            animation: flashText 0.5s ease;
        }
        
        @keyframes flashText {
            0%, 100% { color: #ffffff; }
            50% { color: #cccccc; }
        }
        
        .separator.collapsed .separator-text {
            color: #ff6b6b;
        }
        
        .separator.collapsed:hover .separator-text {
            color: #ff8787;
            animation: flashTextRed 0.5s ease;
        }
        
        @keyframes flashTextRed {
            0%, 100% { color: #ff8787; }
            50% { color: #ffb3b3; }
        }
        
        .separator-icon {
            font-size: 10px;
            transition: transform 0.2s ease;
        }
        
        .separator.collapsed .separator-icon {
            transform: rotate(-90deg);
        }
        
        .category {
            transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
            max-height: 1000px;
            position: relative;
        }
        
        .category.collapsed {
            max-height: 0;
            opacity: 0;
        }
        
        .category.collapsed::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #1e1e1e;
            z-index: 10;
            opacity: 0;
            transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .category:not(.collapsed)::before {
            opacity: 0;
        }
        
        .section {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            justify-items: center;
            max-width: 320px;
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .category.collapsed .section {
            transform: translateY(-20px);
            opacity: 0;
        }
        
        .category:not(.collapsed) .section {
            transform: translateY(0);
            opacity: 1;
        }
        
        .icon-button {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            background-color: #2d2d2d;
            border: 1px solid #3d3d3d;
            border-radius: 12px;
            color: #cccccc;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.1);
            position: relative;
        }
        
        .icon-button:hover {
            background-color: #3d3d3d;
            color: #ffffff;
            transform: scale(1.05);
            animation: flashButton 0.5s ease;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), 
                        0 0 15px rgba(0, 198, 255, 0.5), 
                        0 0 0 2px rgba(255, 255, 255, 0.1);
            filter: brightness(1.2);
        }
        
        @keyframes flashButton {
            0%, 100% { background-color: #3d3d3d; }
            50% { background-color: #7d7d7d; }
        }
        
        /* Tooltip منفصل مع position: fixed */
        .custom-tooltip {
            position: fixed;
            /* Glassmorphism: خلفية زجاجية شفافة */
            background: rgba(102, 126, 234, 0.15);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            
            /* Continuous Neon Glow Border - توهج نيون مستمر */
            border: 2px solid transparent;
            border-radius: 25px; /* Highly Rounded Corners - Capsule-like Rectangle */
            
            /* Continuous Neon Glow - هالة ضوئية مستمرة ناعمة جداً */
            box-shadow:
                /* الطبقة الأساسية للظل */
                0 4px 20px rgba(0, 0, 0, 0.3),
                /* Specular Highlight: لمعة الزجاج الواقعية */
                inset 0 1px 2px rgba(255, 255, 255, 0.3),
                inset 0 -1px 2px rgba(255, 255, 255, 0.2),
                /* Continuous Neon Glow Layers - طبقات التوهج النيون الناعمة جداً */
                0 0 4px rgba(0, 198, 255, 0.25),     /* الطبقة الأولى - توهج ناعم جداً */
                0 0 8px rgba(0, 198, 255, 0.2),      /* الطبقة الثانية - توهج ناعم جداً */
                0 0 12px rgba(102, 126, 234, 0.15),    /* الطبقة الثالثة - توهج ناعم جداً */
                0 0 16px rgba(118, 75, 162, 0.1),     /* الطبقة الرابعة - توهج ناعم جداً */
                0 0 20px rgba(240, 147, 251, 0.08),    /* الطبقة الخامسة - توهج ناعم جداً */
                /* Exact Perimeter Border - حدود ناعمة جداً تتبع شكل الـ Tooltip */
                0 0 0 1px rgba(0, 198, 255, 0.2),
                0 0 0 2px rgba(102, 126, 234, 0.15),
                0 0 0 3px rgba(118, 75, 162, 0.1);
            
            color: #ffffff;
            padding: 10px 20px; /* زيادة الحشوة للحصول على شكل كبسولة أفضل */
            font-size: 12px;
            font-weight: bold;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                        transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                        box-shadow 0.4s ease,
                        filter 0.4s ease;
            z-index: 999999 !important;
            pointer-events: none;
            transform: translate(-50%, 20px) scale(0.7);
            overflow: hidden;
        }
        
        .custom-tooltip.visible {
            opacity: 1;
            visibility: visible;
            transform: translate(-50%, -40px) scale(1.05);
            
            /* تأثيرات إضافية عند الظهور - توهج نيون ناعم جداً */
            box-shadow:
                /* الطبقة الأساسية للظل */
                0 8px 30px rgba(0, 0, 0, 0.5),
                /* Specular Highlight: لمعة الزجاج الواقعية */
                inset 0 1px 2px rgba(255, 255, 255, 0.4),
                inset 0 -1px 2px rgba(255, 255, 255, 0.3),
                /* Continuous Neon Glow Layers - طبقات التوهج النيون الناعمة جداً */
                0 0 5px rgba(0, 198, 255, 0.4),     /* الطبقة الأولى - توهج ناعم جداً */
                0 0 10px rgba(0, 198, 255, 0.35),     /* الطبقة الثانية - توهج ناعم جداً */
                0 0 15px rgba(102, 126, 234, 0.3),     /* الطبقة الثالثة - توهج ناعم جداً */
                0 0 20px rgba(118, 75, 162, 0.25),     /* الطبقة الرابعة - توهج ناعم جداً */
                0 0 25px rgba(240, 147, 251, 0.2),    /* الطبقة الخامسة - توهج ناعم جداً */
                /* Exact Perimeter Border - حدود ناعمة جداً تتبع شكل الـ Tooltip */
                0 0 0 1px rgba(0, 198, 255, 0.35),
                0 0 0 2px rgba(102, 126, 234, 0.3),
                0 0 0 3px rgba(118, 75, 162, 0.25);
            
            filter: brightness(1.2);
        }
        
        /* أطراف التوهج كشكل Tooltip - Exact Perimeter مع Highly Rounded Corners */
        .custom-tooltip::before {
            content: '';
            position: absolute;
            top: -4px;
            left: -4px;
            right: -4px;
            bottom: -4px;
            border-radius: 29px; /* يطابق border-radius للـ Tooltip الرئيسي + 4px */
            background: linear-gradient(135deg,
                rgba(0, 188, 212, 0.35) 0%,
                rgba(102, 126, 234, 0.4) 25%,
                rgba(118, 75, 162, 0.35) 50%,
                rgba(240, 147, 251, 0.35) 75%,
                rgba(0, 188, 212, 0.35) 100%);
            z-index: -1;
            pointer-events: none;
            transition: all 0.4s ease;
            /* Continuous Neon Glow ناعم جداً على الأطراف */
            box-shadow:
                0 0 3px rgba(0, 198, 255, 0.3),
                0 0 6px rgba(102, 126, 234, 0.25),
                0 0 9px rgba(118, 75, 162, 0.2);
            /* تأثير الحركة للتدرج اللوني */
            background-size: 200% 200%;
            animation: gradientShift 3s ease infinite;
        }
        
        .custom-tooltip.visible::before {
            opacity: 1;
            /* توهج نيون ناعم جداً عند الظهور */
            box-shadow:
                0 0 4px rgba(0, 198, 255, 0.45),
                0 0 8px rgba(102, 126, 234, 0.4),
                0 0 12px rgba(118, 75, 162, 0.35),
                inset 0 0 0 1px rgba(255, 255, 255, 0.25);
        }

        /* تأثير النافذة المنبثقة (Dialog Popup Animation) - شفاف */
        .custom-tooltip::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
            transform: translate(-50%, -50%);
            transition: width 0.5s ease, height 0.5s ease;
            z-index: -1;
        }

        .custom-tooltip.visible::after {
            width: 300%;
            height: 300%;
            animation: dialogPopup 0.6s ease-out;
        }

        @keyframes dialogPopup {
            0% {
                width: 0;
                height: 0;
                opacity: 1;
            }
            50% {
                opacity: 0.5;
            }
            100% {
                width: 300%;
                height: 300%;
                opacity: 0;
            }
        }

        /* تأثير حركة التدرج اللوني */
        @keyframes gradientShift {
            0% {
                background-position: 0% 50%;
            }
            50% {
                background-position: 100% 50%;
            }
            100% {
                background-position: 0% 50%;
            }
        }

        /* تأثير الموجة (Wave effect) - شفاف */
        .custom-tooltip .wave-effect {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.15),
                transparent
            );
            transform: scaleX(0);
            transition: transform 0.4s ease;
            border-radius: 0 0 25px 25px;
        }

        .custom-tooltip.visible .wave-effect {
            transform: scaleX(1);
            animation: waveAnimation 1.5s ease-in-out infinite;
        }

        @keyframes waveAnimation {
            0%, 100% {
                transform: scaleX(1) translateX(0);
            }
            50% {
                transform: scaleX(1.2) translateX(10px);
            }
        }
        
        .section {
            overflow: hidden;
        }
        
        .category {
            overflow: hidden;
        }
        
        .icon-button svg {
            fill: currentColor;
            width: 19px;
            height: 19px;
            padding: 0;
            margin: 0;
            display: block;
        }
        
        .icon-button svg text {
            text-anchor: middle;
            dominant-baseline: middle;
        }
        
        .icon-button:hover svg {
            animation: pulse 0.3s ease;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
        }
        
        .icon-button:hover {
            animation: buttonPulse 0.3s ease;
        }
        
        @keyframes buttonPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1.1); }
        }
        
        .icon {
            font-size: 18px;
            font-weight: bold;
        }
        
        .separator {
            height: 1px;
            background-color: #3d3d3d;
            margin: 12px 0;
            transition: all 0.3s ease;
        }
        
        .separator:hover {
            background-color: #4d4d4d;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), 
                        0 0 15px rgba(0, 198, 255, 0.5), 
                        0 0 0 2px rgba(255, 255, 255, 0.1);
            filter: brightness(1.2);
            transform: scaleY(1.05);
        }
    </style>
</head>
<body>
    <div class="separator" onclick="toggleCategory('root-elements')">
        <span class="separator-text">
            <span class="separator-icon">▼</span>
            العناصر الجذرية والأساسية
        </span>
    </div>

    <!-- العناصر الجذرية والأساسية -->
    <div class="category" id="category-root-elements">
        <div class="section">
            <button class="icon-button" onclick="sendMessage('insertTag', 'html')" data-tooltip="<html>" title="html">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <text x="7" y="16" font-size="6" fill="currentColor"></></text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'head')" data-tooltip="<head>" title="head">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="6" fill="none" stroke="currentColor"/>
                    <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'body')" data-tooltip="<body>" title="body">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <line x1="6" y1="8" x2="18" y2="8" stroke="currentColor"/>
                    <line x1="6" y1="12" x2="18" y2="12" stroke="currentColor"/>
                    <line x1="6" y1="16" x2="12" y2="16" stroke="currentColor"/>
                </svg>
            </button>
        </div>
    </div>
    <!-- / العناصر الجذرية والأساسية -->

    <div class="separator" onclick="toggleCategory('metadata')">
        <span class="separator-text">
            <span class="separator-icon">▼</span>
            بيانات الميتا
        </span>
    </div>

    <!-- بيانات الميتا -->
    <div class="category" id="category-metadata">
        <div class="section">
            <button class="icon-button" onclick="sendMessage('insertTag', 'title')" data-tooltip="<title>" title="title">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="6" fill="none" stroke="currentColor"/>
                    <line x1="6" y1="6" x2="18" y2="6" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'base')" data-tooltip="<base>" title="base">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M12 2l3 6h-6l3-6z" fill="none" stroke="currentColor"/>
                    <line x1="12" y1="8" x2="12" y2="22" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'link')" data-tooltip="<link>" title="link">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" fill="none" stroke="currentColor"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'meta')" data-tooltip="<meta>" title="meta">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <circle cx="8" cy="8" r="2" fill="currentColor"/>
                    <line x1="12" y1="8" x2="20" y2="8" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'style')" data-tooltip="<style>" title="style">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor"/>
                </svg>
            </button>
        </div>
    </div>
    <!-- / بيانات الميتا -->

    <div class="separator" onclick="toggleCategory('sections')">
        <span class="separator-text">
            <span class="separator-icon">▼</span>
            أقسام المحتوى
        </span>
    </div>

    <!-- أقسام المحتوى -->
    <div class="category" id="category-sections">
        <div class="section">
            <button class="icon-button" onclick="sendMessage('insertTag', 'article')" data-tooltip="<article>" title="article">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <line x1="6" y1="8" x2="18" y2="8" stroke="currentColor"/>
                    <line x1="6" y1="12" x2="18" y2="12" stroke="currentColor"/>
                    <line x1="6" y1="16" x2="12" y2="16" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'section')" data-tooltip="<section>" title="section">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="5" width="18" height="14" fill="none" stroke="currentColor"/>
                    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'nav')" data-tooltip="<nav>" title="nav">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor"/>
                    <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor"/>
                    <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'aside')" data-tooltip="<aside>" title="aside">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="14" y="3" width="7" height="18" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'h1')" data-tooltip="<h1>" title="h1">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="12" y="16" font-size="14" font-weight="bold" fill="currentColor" text-anchor="middle">H1</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'h2')" data-tooltip="<h2>" title="h2">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="12" y="16" font-size="13" font-weight="bold" fill="currentColor" text-anchor="middle">H2</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'h3')" data-tooltip="<h3>" title="h3">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="12" y="16" font-size="12" font-weight="bold" fill="currentColor" text-anchor="middle">H3</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'h4')" data-tooltip="<h4>" title="h4">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="12" y="16" font-size="11" font-weight="bold" fill="currentColor" text-anchor="middle">H4</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'h5')" data-tooltip="<h5>" title="h5">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="12" y="16" font-size="10" font-weight="bold" fill="currentColor" text-anchor="middle">H5</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'h6')" data-tooltip="<h6>" title="h6">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="12" y="16" font-size="9" font-weight="bold" fill="currentColor" text-anchor="middle">H6</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'header')" data-tooltip="<header>" title="header">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="6" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'footer')" data-tooltip="<footer>" title="footer">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="15" width="18" height="6" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'address')" data-tooltip="<address>" title="address">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="none" stroke="currentColor"/>
                    <circle cx="12" cy="9" r="2.5" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'main')" data-tooltip="<main>" title="main">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <rect x="6" y="6" width="12" height="12" fill="none" stroke="currentColor"/>
                </svg>
            </button>
        </div>
    </div>
    <!-- / أقسام المحتوى -->

    <div class="separator" onclick="toggleCategory('grouping')">
        <span class="separator-text">
            <span class="separator-icon">▼</span>
            تنظيم النصوص
        </span>
    </div>

    <!-- تنظيم النصوص -->
    <div class="category" id="category-grouping">
        <div class="section">
            <button class="icon-button" onclick="sendMessage('insertTag', 'p')" data-tooltip="<p>" title="p">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor"/>
                    <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor"/>
                    <line x1="4" y1="18" x2="12" y2="18" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'hr')" data-tooltip="<hr>" title="hr">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'pre')" data-tooltip="<pre>" title="pre">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <polyline points="7 10 5 12 7 14" fill="none" stroke="currentColor"/>
                    <polyline points="17 10 19 12 17 14" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'blockquote')" data-tooltip="<blockquote>" title="blockquote">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M6 17h3l2-4V7H5v6h3zM13 17h3l2-4V7h-6v6h3z" fill="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'ol')" data-tooltip="<ol>" title="ol">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="5" y="8" font-size="9" fill="currentColor">1</text>
                    <line x1="10" y1="6" x2="20" y2="6" stroke="currentColor"/>
                    <text x="5" y="14" font-size="9" fill="currentColor">2</text>
                    <line x1="10" y1="12" x2="20" y2="12" stroke="currentColor"/>
                    <text x="5" y="20" font-size="9" fill="currentColor">3</text>
                    <line x1="10" y1="18" x2="20" y2="18" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'ul')" data-tooltip="<ul>" title="ul">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <circle cx="5" cy="6" r="2" fill="currentColor"/>
                    <line x1="10" y1="6" x2="20" y2="6" stroke="currentColor"/>
                    <circle cx="5" cy="12" r="2" fill="currentColor"/>
                    <line x1="10" y1="12" x2="20" y2="12" stroke="currentColor"/>
                    <circle cx="5" cy="18" r="2" fill="currentColor"/>
                    <line x1="10" y1="18" x2="20" y2="18" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'li')" data-tooltip="<li>" title="li">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <circle cx="5" cy="12" r="2" fill="currentColor"/>
                    <line x1="10" y1="12" x2="20" y2="12" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'dl')" data-tooltip="<dl>" title="dl">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <text x="12" y="10" font-size="7" fill="currentColor" text-anchor="middle">dt</text>
                    <text x="12" y="18" font-size="7" fill="currentColor" text-anchor="middle">dd</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'dt')" data-tooltip="<dt>" title="dt">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="4" width="18" height="16" fill="none" stroke="currentColor"/>
                    <text x="12" y="10" font-size="9" font-weight="bold" fill="currentColor" text-anchor="middle">dt</text>
                    <line x1="6" y1="14" x2="18" y2="14" stroke="currentColor" stroke-width="2"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'dd')" data-tooltip="<dd>" title="dd">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="4" width="18" height="16" fill="none" stroke="currentColor"/>
                    <circle cx="7" cy="10" r="2" fill="currentColor"/>
                    <line x1="12" y1="10" x2="18" y2="10" stroke="currentColor"/>
                    <line x1="12" y1="14" x2="18" y2="14" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'figure')" data-tooltip="<figure>" title="figure">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <circle cx="12" cy="9" r="3" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'figcaption')" data-tooltip="<figcaption>" title="figcaption">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="4" fill="none" stroke="currentColor"/>
                    <line x1="6" y1="5" x2="18" y2="5" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'div')" data-tooltip="<div>" title="div">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                </svg>
            </button>
        </div>
    </div>
    <!-- / تنظيم النصوص -->

    <div class="separator" onclick="toggleCategory('text-level')">
        <span class="separator-text">
            <span class="separator-icon">▼</span>
            النصوص السطرية
        </span>
    </div>

    <!-- النصوص السطرية -->
    <div class="category" id="category-text-level">
        <div class="section">
            <button class="icon-button" onclick="sendMessage('insertTag', 'a')" data-tooltip="<a>" title="a">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" fill="none" stroke="currentColor"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'em')" data-tooltip="<em>" title="em">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="8" y="18" font-size="10" font-style="italic" fill="currentColor">I</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'strong')" data-tooltip="<strong>" title="strong">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="7" y="18" font-size="10" font-weight="bold" fill="currentColor">B</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'small')" data-tooltip="<small>" title="small">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="7" y="18" font-size="6" fill="currentColor">Aa</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 's')" data-tooltip="<s>" title="s">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="8" y="14" font-size="10" fill="currentColor">S</text>
                    <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'cite')" data-tooltip="<cite>" title="cite">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M6 17h3l2-4V7H5v6h3zM13 17h3l2-4V7h-6v6h3z" fill="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'q')" data-tooltip="<q>" title="q">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M6 17h3l2-4V7H5v6h3zM13 17h3l2-4V7h-6v6h3z" fill="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'dfn')" data-tooltip="<dfn>" title="dfn">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="4" width="18" height="16" fill="none" stroke="currentColor"/>
                    <text x="12" y="10" font-size="8" font-weight="bold" fill="currentColor" text-anchor="middle">def</text>
                    <line x1="6" y1="14" x2="18" y2="14" stroke="currentColor" stroke-dasharray="2,2"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'abbr')" data-tooltip="<abbr>" title="abbr">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="12" y="14" font-size="9" fill="currentColor" text-anchor="middle">Abc</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'time')" data-tooltip="<time>" title="time">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor"/>
                    <polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'code')" data-tooltip="<code>" title="code">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <polyline points="16 18 22 12 16 6" fill="none" stroke="currentColor"/>
                    <polyline points="8 6 2 12 8 18" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'sub')" data-tooltip="<sub>" title="sub">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="8" y="14" font-size="10" fill="currentColor">x</text>
                    <text x="14" y="18" font-size="7" fill="currentColor">2</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'sup')" data-tooltip="<sup>" title="sup">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="8" y="18" font-size="10" fill="currentColor">x</text>
                    <text x="14" y="10" font-size="7" fill="currentColor">2</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'i')" data-tooltip="<i>" title="i">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="9" y="18" font-size="10" font-style="italic" fill="currentColor">I</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'b')" data-tooltip="<b>" title="b">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="8" y="18" font-size="10" font-weight="bold" fill="currentColor">B</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'u')" data-tooltip="<u>" title="u">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="8" y="16" font-size="10" fill="currentColor">U</text>
                    <line x1="7" y1="18" x2="17" y2="18" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'mark')" data-tooltip="<mark>" title="mark">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'span')" data-tooltip="<span>" title="span">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="6" y="6" width="12" height="12" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'br')" data-tooltip="<br>" title="br">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M5 12h14" stroke="currentColor"/>
                    <path d="M12 5v14" stroke="currentColor"/>
                </svg>
            </button>
        </div>
    </div>
    <!-- / النصوص السطرية -->

    <div class="separator" onclick="toggleCategory('embedded')">
        <span class="separator-text">
            <span class="separator-icon">▼</span>
            المحتوى المدمج
        </span>
    </div>

    <!-- المحتوى المدمج -->
    <div class="category" id="category-embedded">
        <div class="section">
            <button class="icon-button" onclick="sendMessage('insertTag', 'picture')" data-tooltip="<picture>" title="picture">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                    <path d="M21 15l-5-5L5 21" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'img')" data-tooltip="<img>" title="img">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                    <path d="M21 15l-5-5L5 21" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'iframe')" data-tooltip="<iframe>" title="iframe">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'video')" data-tooltip="<video>" title="video">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="2" y="4" width="20" height="16" fill="none" stroke="currentColor"/>
                    <polygon points="10 8 16 12 10 16" fill="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'audio')" data-tooltip="<audio>" title="audio">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M9 18V5l12-2v13" fill="none" stroke="currentColor"/>
                    <circle cx="6" cy="18" r="3" fill="none" stroke="currentColor"/>
                    <circle cx="18" cy="16" r="3" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'source')" data-tooltip="<source>" title="source">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'canvas')" data-tooltip="<canvas>" title="canvas">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'svg')" data-tooltip="<svg>" title="svg">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor"/>
                </svg>
            </button>
        </div>
    </div>
    <!-- / المحتوى المدمج -->

    <div class="separator" onclick="toggleCategory('tables')">
        <span class="separator-text">
            <span class="separator-icon">▼</span>
            الجداول
        </span>
    </div>

    <!-- الجداول -->
    <div class="category" id="category-tables">
        <div class="section">
            <button class="icon-button" onclick="sendMessage('insertTag', 'table')" data-tooltip="<table>" title="table">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor"/>
                    <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor"/>
                    <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor"/>
                    <line x1="15" y1="3" x2="15" y2="21" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'caption')" data-tooltip="<caption>" title="caption">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="4" fill="none" stroke="currentColor"/>
                    <line x1="6" y1="5" x2="18" y2="5" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'thead')" data-tooltip="<thead>" title="thead">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="6" fill="none" stroke="currentColor"/>
                    <line x1="9" y1="3" x2="9" y2="9" stroke="currentColor"/>
                    <line x1="15" y1="3" x2="15" y2="9" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'tbody')" data-tooltip="<tbody>" title="tbody">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="9" width="18" height="12" fill="none" stroke="currentColor"/>
                    <line x1="9" y1="9" x2="9" y2="21" stroke="currentColor"/>
                    <line x1="15" y1="9" x2="15" y2="21" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'tfoot')" data-tooltip="<tfoot>" title="tfoot">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="15" width="18" height="6" fill="none" stroke="currentColor"/>
                    <line x1="9" y1="15" x2="9" y2="21" stroke="currentColor"/>
                    <line x1="15" y1="15" x2="15" y2="21" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'tr')" data-tooltip="<tr>" title="tr">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="8" width="18" height="8" fill="none" stroke="currentColor"/>
                    <line x1="9" y1="8" x2="9" y2="16" stroke="currentColor"/>
                    <line x1="15" y1="8" x2="15" y2="16" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'th')" data-tooltip="<th>" title="th">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="4" y="8" width="16" height="8" fill="none" stroke="currentColor"/>
                    <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'td')" data-tooltip="<td>" title="td">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="4" y="8" width="16" height="8" fill="none" stroke="currentColor"/>
                </svg>
            </button>
        </div>
    </div>
    <!-- / الجداول -->

    <div class="separator" onclick="toggleCategory('forms')">
        <span class="separator-text">
            <span class="separator-icon">▼</span>
            النماذج
        </span>
    </div>

    <!-- النماذج -->
    <div class="category" id="category-forms">
        <div class="section">
            <button class="icon-button" onclick="sendMessage('insertTag', 'form')" data-tooltip="<form>" title="form">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <line x1="6" y1="8" x2="18" y2="8" stroke="currentColor"/>
                    <line x1="6" y1="12" x2="18" y2="12" stroke="currentColor"/>
                    <line x1="6" y1="16" x2="12" y2="16" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'label')" data-tooltip="<label>" title="label">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M4 4h16v16H4z" fill="none" stroke="currentColor"/>
                    <path d="M8 8h8M8 12h8M8 16h4" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'input')" data-tooltip="<input>" title="input">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="8" width="18" height="8" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'button')" data-tooltip="<button>" title="button">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="4" y="8" width="16" height="8" rx="2" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'select')" data-tooltip="<select>" title="select">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
                    <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M14 14l3 3 3-3" fill="none" stroke="currentColor" stroke-width="2"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'option')" data-tooltip="<option>" title="option">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="8" width="18" height="4" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'textarea')" data-tooltip="<textarea>" title="textarea">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="5" width="18" height="14" fill="none" stroke="currentColor"/>
                    <line x1="6" y1="8" x2="18" y2="8" stroke="currentColor"/>
                    <line x1="6" y1="11" x2="18" y2="11" stroke="currentColor"/>
                    <line x1="6" y1="14" x2="12" y2="14" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'output')" data-tooltip="<output>" title="output">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="8" width="18" height="8" fill="none" stroke="currentColor"/>
                    <text x="12" y="14" font-size="7" fill="currentColor" text-anchor="middle">out</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'progress')" data-tooltip="<progress>" title="progress">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="10" width="18" height="4" fill="none" stroke="currentColor" stroke-width="2"/>
                    <rect x="3" y="10" width="6" height="4" fill="currentColor">
                        <animate attributeName="x" values="3;15;3" dur="1.5s" repeatCount="indefinite"/>
                        <animate attributeName="width" values="6;6;6" dur="1.5s" repeatCount="indefinite"/>
                    </rect>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'meter')" data-tooltip="<meter>" title="meter">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="10" width="18" height="4" fill="none" stroke="currentColor" stroke-width="2"/>
                    <rect x="3" y="10" width="9" height="4" fill="currentColor"/>
                    <text x="3" y="8" font-size="5" fill="currentColor">0</text>
                    <text x="12" y="8" font-size="5" fill="currentColor" text-anchor="middle">50</text>
                    <text x="21" y="8" font-size="5" fill="currentColor" text-anchor="end">100</text>
                </svg>
            </button>
        </div>
    </div>
    <!-- / النماذج -->

    <div class="separator" onclick="toggleCategory('interactive')">
        <span class="separator-text">
            <span class="separator-icon">▼</span>
            العناصر التفاعلية
        </span>
    </div>

    <!-- العناصر التفاعلية -->
    <div class="category" id="category-interactive">
        <div class="section">
            <button class="icon-button" onclick="sendMessage('insertTag', 'details')" data-tooltip="<details>" title="details">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <path d="M8 12l3 3 3-3" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'summary')" data-tooltip="<summary>" title="summary">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="6" fill="none" stroke="currentColor"/>
                    <line x1="6" y1="6" x2="18" y2="6" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'dialog')" data-tooltip="<dialog>" title="dialog">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="6" width="18" height="12" fill="none" stroke="currentColor"/>
                    <circle cx="8" cy="12" r="2" fill="currentColor"/>
                    <line x1="12" y1="10" x2="18" y2="10" stroke="currentColor"/>
                    <line x1="12" y1="14" x2="16" y2="14" stroke="currentColor"/>
                </svg>
            </button>
        </div>
    </div>
    <!-- / العناصر التفاعلية -->

    <div class="separator" onclick="toggleCategory('editing')">
        <span class="separator-text">
            <span class="separator-icon">▼</span>
            تعديل النصوص
        </span>
    </div>

    <!-- تعديل النصوص -->
    <div class="category" id="category-editing">
        <div class="section">
            <button class="icon-button" onclick="sendMessage('insertTag', 'ins')" data-tooltip="<ins>" title="ins">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor"/>
                    <path d="M12 4v16" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'del')" data-tooltip="<del>" title="del">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'kbd')" data-tooltip="<kbd>" title="kbd">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="4" y="8" width="16" height="8" fill="none" stroke="currentColor"/>
                    <text x="12" y="14" font-size="8" fill="currentColor" text-anchor="middle">⌨</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'samp')" data-tooltip="<samp>" title="samp">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="6" width="18" height="12" fill="none" stroke="currentColor"/>
                    <text x="12" y="14" font-size="8" fill="currentColor" text-anchor="middle">code</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'var')" data-tooltip="<var>" title="var">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <text x="12" y="15" font-size="11" font-style="italic" fill="currentColor" text-anchor="middle">x</text>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'wbr')" data-tooltip="<wbr>" title="wbr">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M5 12h14" stroke="currentColor"/>
                    <path d="M12 5v14" stroke="currentColor"/>
                </svg>
            </button>
        </div>
    </div>
    <!-- / تعديل النصوص -->

    <div class="separator" onclick="toggleCategory('scripting')">
        <span class="separator-text">
            <span class="separator-icon">▼</span>
            السكربت
        </span>
    </div>

    <!-- السكربت -->
    <div class="category" id="category-scripting">
        <div class="section">
            <button class="icon-button" onclick="sendMessage('insertTag', 'script')" data-tooltip="<script>" title="script">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <polyline points="16 18 22 12 16 6" fill="none" stroke="currentColor"/>
                    <polyline points="8 6 2 12 8 18" fill="none" stroke="currentColor"/>
                </svg>
            </button>
            <button class="icon-button" onclick="sendMessage('insertTag', 'noscript')" data-tooltip="<noscript>" title="noscript">
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor"/>
                    <text x="12" y="14" font-size="7" fill="currentColor" text-anchor="middle">no</text>
                </svg>
            </button>
        </div>
    </div>
    <!-- / السكربت -->
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function sendMessage(type, tag) {
            vscode.postMessage({
                type: type,
                tag: tag
            });
        }
        
        function toggleCategory(categoryId) {
            const category = document.getElementById('category-' + categoryId);
            const separator = event.currentTarget;
            
            if (category.classList.contains('collapsed')) {
                category.classList.remove('collapsed');
                separator.classList.remove('collapsed');
            } else {
                category.classList.add('collapsed');
                separator.classList.add('collapsed');
            }
        }

        // إنشاء وإدارة الـ Tooltip
        (function() {
            // إنشاء عنصر Tooltip منفصل
            const tooltip = document.createElement('div');
            tooltip.className = 'custom-tooltip';
            document.body.appendChild(tooltip);

            // متغير لتخزين المؤقت الحالي
            let typingTimeout = null;

            // دالة لكتابة النص حرفًا بحرف (Typewriter effect)
            function typeText(element, text, speed) {
                let index = 0;
                element.textContent = '';
                
                function type() {
                    if (index < text.length) {
                        element.textContent += text.charAt(index);
                        index++;
                        typingTimeout = setTimeout(type, speed);
                    }
                }
                
                type();
            }

            // الحصول على جميع الأزرار
            const iconButtons = document.querySelectorAll('.icon-button');

            // إضافة أحداث hover لكل زر
            iconButtons.forEach(button => {
                button.addEventListener('mouseenter', function(e) {
                    // استخدام data-tooltip (علامة الوسم) فقط
                    var tooltipText = this.getAttribute('data-tooltip');
                    
                    if (tooltipText) {
                        // إيقاف أي كتابة سابقة
                        if (typingTimeout) {
                            clearTimeout(typingTimeout);
                        }
                        
                        // حساب موقع الزر بالنسبة للشاشة
                        var rect = this.getBoundingClientRect();
                        
                        // تعيين موقع الـ Tooltip
                        tooltip.style.left = (rect.left + rect.width / 2) + 'px';
                        tooltip.style.top = rect.top + 'px';
                        
                        // إظهار الـ Tooltip
                        tooltip.classList.add('visible');
                        
                        // كتابة علامة الوسم حرفًا بحرف
                        typeText(tooltip, tooltipText, 25);
                    }
                });

                button.addEventListener('mouseleave', function() {
                    // إيقاف الكتابة
                    if (typingTimeout) {
                        clearTimeout(typingTimeout);
                        typingTimeout = null;
                    }
                    
                    // إخفاء الـ Tooltip
                    tooltip.classList.remove('visible');
                    
                    // مسح النص بعد انتهاء الانيميشن
                    setTimeout(function() {
                        if (!tooltip.classList.contains('visible')) {
                            tooltip.textContent = '';
                        }
                    }, 400);
                });
            });
        })();
    </script>
</body>
</html>`;
    }
}

/**
 * Webview Panel Provider
 * يوفر لوحة Webview منفصلة تفتح في تبويب جديد
 */
class WebPageBuilderPanel {
    public static currentPanel: WebPageBuilderPanel | undefined;
    public static readonly viewType = 'webPageBuilder.webviews';

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // إذا كان اللوحة موجودة بالفعل، قم بإظهارها
        if (WebPageBuilderPanel.currentPanel) {
            WebPageBuilderPanel.currentPanel._panel.reveal(column);
            // طلب الكود الحالي من EditorPanel عند إعادة فتح التبويب
            if (EditorPanel) {
                EditorPanel.webview.postMessage({
                    type: 'requestCurrentCode'
                });
            }
            return;
        }

        // إنشاء لوحة جديدة
        const panel = vscode.window.createWebviewPanel(
            WebPageBuilderPanel.viewType,
            'Webviews',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [extensionUri],
                retainContextWhenHidden: true
            }
        );

        WebPageBuilderPanel.currentPanel = new WebPageBuilderPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, private readonly _extensionUri: vscode.Uri) {
        this._panel = panel;

        // تعيين محتوى Webview - عرض iframe لمعاينة الكود
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

        // الاستماع إلى أحداث إغلاق اللوحة
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // الاستماع إلى أحداث تغيير حالة العرض (عند إعادة فتح التبويب)
        this._panel.onDidChangeViewState(() => {
            if (this._panel.visible) {
                // طلب الكود الحالي من EditorPanel عند إعادة فتح التبويب
                if (EditorPanel) {
                    EditorPanel.webview.postMessage({
                        type: 'requestCurrentCode'
                    });
                }
            }
        }, null, this._disposables);

        // الاستماع إلى الرسائل من Webview - تمرير الرسائل إلى Extension
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'openBuilder':
                        vscode.window.showInformationMessage('Opening Web Page Builder...');
                        break;
                    case 'newProject':
                        vscode.window.showInformationMessage('Creating new project...');
                        break;
                    case 'openSource':
                        vscode.window.showInformationMessage('Opening source files...');
                        break;
                    case 'insertTag':
                        vscode.window.showInformationMessage(`<${message.tag}>`);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public updateCode(code: string) {
        // إرسال الكود إلى webview لتحديث العرض
        this._panel.webview.postMessage({
            type: 'codeUpdate',
            code: code
        });
    }

    public dispose() {
        WebPageBuilderPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Webviews - Web Page Builder</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #ffffff;
            color: #000000;
            min-height: 100vh;
        }
        #preview {
            width: 100%;
            height: 100vh;
            border: none;
        }
    </style>
</head>
<body>
    <iframe id="preview"></iframe>
    <script>
        const vscode = acquireVsCodeApi();
        const preview = document.getElementById('preview');
        let isUpdatingFromEditor = false;

        // الاستماع للرسائل من Extension - تحديث iframe بالكود من Editor
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'codeUpdate':
                    isUpdatingFromEditor = true;
                    const doc = preview.contentDocument || preview.contentWindow.document;
                    doc.open();
                    doc.write(message.code);
                    doc.close();
                    isUpdatingFromEditor = false;
                    break;
            }
        });

        // الاستماع للتغييرات في iframe وإرسالها للـ editor
        preview.addEventListener('load', () => {
            const doc = preview.contentDocument || preview.contentWindow.document;

            // مراقبة التغييرات في DOM
            const observer = new MutationObserver(() => {
                if (!isUpdatingFromEditor) {
                    const html = doc.documentElement.outerHTML;
                    vscode.postMessage({
                        type: 'updateEditor',
                        code: html
                    });
                }
            });

            observer.observe(doc, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true
            });
        });
    </script>
</body>
</html>`;
    }
}
