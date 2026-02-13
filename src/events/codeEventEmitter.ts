import * as vscode from 'vscode';

/**
 * نظام أحداث مركزي للتواصل بين المكونات
 * يستخدم لتجنب الاستيراد الدائري بين EditorPanel و WebPageBuilderPanel
 */
class CodeEventEmitter {
    private static instance: CodeEventEmitter;
    private _onCodeChange: vscode.EventEmitter<string>;
    
    public readonly onCodeChange: vscode.Event<string>;

    private constructor() {
        this._onCodeChange = new vscode.EventEmitter<string>();
        this.onCodeChange = this._onCodeChange.event;
    }

    public static getInstance(): CodeEventEmitter {
        if (!CodeEventEmitter.instance) {
            CodeEventEmitter.instance = new CodeEventEmitter();
        }
        return CodeEventEmitter.instance;
    }

    /**
     * إرسال حدث تغيير الكود
     */
    public emitCodeChange(code: string): void {
        this._onCodeChange.fire(code);
    }

    /**
     * التخلص من الموارد
     */
    public dispose(): void {
        this._onCodeChange.dispose();
    }
}

export const codeEventEmitter = CodeEventEmitter.getInstance();
