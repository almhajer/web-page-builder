/**
 * ثوابت الرسائل
 */

import { MESSAGE_TYPES } from './index';

/**
 * رسائل الـ Webview
 */
export const WEBVIEW_MESSAGES = {
    // رسائل استلام
    WEBVIEW_READY: 'webview:ready',
    CODE_UPDATED: 'webview:codeUpdated',
    
    // رسائل إرسال
    SEND_CODE: MESSAGE_TYPES.UPDATE_CODE,
    REQUEST_CODE: MESSAGE_TYPES.REQUEST_CURRENT_CODE
} as const;

/**
 * رسائل الـ Extension
 */
export const EXTENSION_MESSAGES = {
    // رسائل استلام
    CODE_RECEIVED: 'extension:codeReceived',
    EDITOR_UPDATED: 'extension:editorUpdated',
    
    // رسائل إرسال
    UPDATE_EDITOR: MESSAGE_TYPES.UPDATE_EDITOR_VALUE,
    REQUEST_CODE: MESSAGE_TYPES.REQUEST_CURRENT_CODE
} as const;

/**
 * رسائل الخطأ
 */
export const ERROR_MESSAGES = {
    EDITOR_NOT_OPEN: 'الرجاء فتح محرر الكود أولاً',
    CODE_REQUEST_TIMEOUT: 'فشل استلام الكود من المحرر (انتهت المهلة الزمنية)',
    SAVE_FAILED: 'فشل حفظ الملف',
    SAVE_SUCCESS: 'تم حفظ الملف بنجاح',
    WEBVIEW_NOT_READY: 'الـ Webview غير جاهز'
} as const;
