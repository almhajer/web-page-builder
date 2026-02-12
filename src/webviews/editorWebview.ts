import { MESSAGE_TYPES } from '../constants';

/**
 * الحصول على محتوى HTML للـ webview الخاص بالمحرر
 */
export function getEditorWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editor</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs/loader.min.js"></script>
    <style>
        body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background-color: #1e1e1e; }
        #container { height: 100vh; width: 100%; }
    </style>
</head>
<body>
    <div id="container"></div>
    <script>
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs' }});
        require(['vs/editor/editor.main'], function() {
            const vscode = acquireVsCodeApi();
            let editor = null;

            window.addEventListener('message', event => {
                const message = event.data;
                console.log('Webview received message:', message);
                console.log('Editor exists:', editor !== null);

                switch (message.type) {
                    case '${MESSAGE_TYPES.UPDATE_EDITOR_VALUE}':
                        if (editor) {
                            editor.setValue(message.code);
                        }
                        break;
                    case '${MESSAGE_TYPES.REQUEST_CURRENT_CODE}':
                        if (editor) {
                            const code = editor.getValue();
                            console.log('Sending code to extension, length:', code.length);
                            vscode.postMessage({
                                type: '${MESSAGE_TYPES.UPDATE_CODE}',
                                code: code,
                                requestId: message.requestId
                            });
                        }
                        break;
                }
            });

            editor = monaco.editor.create(document.getElementById('container'), {
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

            editor.onDidChangeModelContent(() => {
                vscode.postMessage({
                    type: '${MESSAGE_TYPES.UPDATE_CODE}',
                    code: editor.getValue()
                });
            });

            vscode.postMessage({
                type: '${MESSAGE_TYPES.UPDATE_CODE}',
                code: editor.getValue()
            });
        });
    </script>
</body>
</html>`;
}
