import * as vscode from 'vscode';

/**
 * أنواع TypeScript المستخدمة في المشروع
 */

/**
 * أنواع الرسائل بين Extension و Webview
 */
export interface WebviewMessage {
    type: string;
    requestId?: string;
    code?: string;
    tag?: string;
}

/**
 * أنواع الرسائل بين Extension و Webview
 */
export interface ExtensionMessage {
    type: string;
    requestId?: string;
    code?: string;
}

/**
 * طلب الحفظ
 */
export interface SaveRequest {
    requestId: string;
    code: string;
}

/**
 * نتيجة الحفظ
 */
export interface SaveResult {
    success: boolean;
    uri?: vscode.Uri;
    error?: string;
}

/**
 * معلومات المحرر
 */
export interface EditorInfo {
    panel: vscode.WebviewPanel | null;
    isReady: boolean;
}

/**
 * معلومات Webview
 */
export interface WebviewInfo {
    panel: vscode.WebviewPanel | null;
    isReady: boolean;
}
