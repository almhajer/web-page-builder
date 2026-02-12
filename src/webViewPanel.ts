import * as vscode from 'vscode';

/**
 * Creates and displays a WebviewPanel directly with the specified configuration.
 * The panel uses viewType 'Editor', is titled 'Editor',
 * appears in the first column, and has scripts enabled.
 * This function creates the panel immediately without requiring any commands.
 */
export function createEditorWebviewPanel(): vscode.WebviewPanel {
    // Create the webview panel directly
    const panel = vscode.window.createWebviewPanel(
        'Editor',           // viewType: Identifies the type of the webview panel
        'Editor',                 // title: Title of the panel displayed to the user
        vscode.ViewColumn.One,     // viewColumn: Editor column where the panel will show
        {
            enableScripts: true    // options: Enable JavaScript execution in the webview
        }
    );

    // Set the webview HTML content immediately
    panel.webview.html = `<!DOCTYPE html>
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
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs' }});
        require(['vs/editor/editor.main'], function() {
            window.editor = monaco.editor.create(document.getElementById('container'), {
                value: "\\n",
                language: 'html',
                theme: 'vs-dark',
                automaticLayout: true,
                fontSize: 14,
                suggestOnTriggerCharacters: true
            });
        });
    </script>
</body>
</html>`;

    // Handle panel disposal
    panel.onDidDispose(() => {
        console.log('Editor panel was closed');
    });

    return panel;
}

/**
 * Example: Call this function directly to show the panel immediately
 * createEditorWebviewPanel();
 */
