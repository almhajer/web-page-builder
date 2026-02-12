import * as vscode from 'vscode';
import { COMMANDS, MESSAGE_TYPES, TIMEOUTS, MAX_RETRIES, DEFAULTS } from '../constants';
import { SaveRequest, SaveResult } from '../types';

/**
 * خدمة إدارة عملية الحفظ
 * مسؤول عن تنفيذ دالة "حفظ باسم"
 */
export class SaveService {
    constructor(private readonly editorService: any) {}

    /**
     * تنفيذ دالة حفظ باسم
     */
    public async saveAs(): Promise<SaveResult> {
        try {
            // طلب الكود الحالي من المحرر
            const code = await this.editorService.requestCurrentCode();

            // فتح نافذة حفظ باسم
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(DEFAULTS.SAVE_FILENAME)
            });

            if (!uri) {
                return { success: false };
            }

            // حفظ الكود في الملف
            await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf8'));

            // عرض رسالة النجاح
            vscode.window.showInformationMessage(`تم حفظ الملف: ${uri.fsPath}`);

            return { success: true, uri };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`خطأ في الحفظ: ${errorMessage}`);
            return { success: false, error: errorMessage };
        }
    }

    /**
     * تنفيذ عملية الحفظ مع إعادة المحاولة
     */
    public async saveAsWithRetry(): Promise<SaveResult> {
        let lastError: string | null = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`Save attempt ${attempt} of ${MAX_RETRIES}`);

                // طلب الكود الحالي من المحرر
                const code = await this.editorService.requestCurrentCode();

            // فتح نافذة حفظ باسم
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(DEFAULTS.SAVE_FILENAME)
            });

                if (!uri) {
                    return { success: false };
                }

                // حفظ الكود في الملف
                await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf8'));

                // عرض رسالة النجاح
                vscode.window.showInformationMessage(`تم حفظ الملف: ${uri.fsPath}`);

                return { success: true, uri };
            } catch (error) {
                lastError = error instanceof Error ? error.message : String(error);
                console.error(`Attempt ${attempt} failed:`, lastError);

                if (attempt < MAX_RETRIES) {
                    // انتظار قبل إعادة المحاولة
                    await this.delay(TIMEOUTS.RETRY_DELAY);
                }
            }
        }

        const errorMessage = lastError || 'فشل الحفظ بعد عدة محاولات';
        vscode.window.showErrorMessage(errorMessage);
        return { success: false, error: errorMessage };
    }

    /**
     * تأخير لمدة محددة
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
