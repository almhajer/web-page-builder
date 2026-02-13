import * as vscode from 'vscode';
import * as path from 'path';
import { readFile } from 'fs/promises';
import { loadLocale, getLocale } from '../locales/localeService';

/**
 * إعدادات SettingsPanel
 */
const SETTINGS_CONFIG = {
    VIEW_TYPE: 'Settings',
    TITLE: 'إعدادات Web Page Builder'
} as const;

/**
 * رسائل Webview
 */
const WEBVIEW_MESSAGES = {
    GET_SETTINGS: 'getSettings',
    SETTINGS_LOADED: 'settingsLoaded',
    SAVE_LANGUAGE: 'saveLanguage'
} as const;

/**
 * فئة SettingsPanel لإدارة لوحة الإعدادات
 * تستخدم نمط Singleton لضمان وجود مثيل واحد فقط
 */
export class SettingsPanel {
    private static instance: SettingsPanel | null = null;
    private panel: vscode.WebviewPanel;
    private context: vscode.ExtensionContext;

    private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
        this.panel = panel;
        this.context = context;
        this.setupEventHandlers();
    }

    /**
     * الحصول على المثيل الحالي
     */
    public static getInstance(): SettingsPanel | null {
        return SettingsPanel.instance;
    }

    /**
     * إنشاء SettingsPanel جديد
     */
    public static async create(context: vscode.ExtensionContext): Promise<SettingsPanel> {
        if (SettingsPanel.instance) {
            SettingsPanel.instance.panel.reveal();
            return SettingsPanel.instance;
        }

        const panel = vscode.window.createWebviewPanel(
            SETTINGS_CONFIG.VIEW_TYPE,
            SETTINGS_CONFIG.TITLE,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: []
            }
        );

        // تعيين محتوى HTML للـ webview
        panel.webview.html = await SettingsPanel.getSettingsHtml(context.extensionUri);

        SettingsPanel.instance = new SettingsPanel(panel, context);
        return SettingsPanel.instance;
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
     * إعداد معالجات الأحداث
     */
    private setupEventHandlers(): void {
        // معالج حدث إغلاق اللوحة
        this.panel.onDidDispose(() => {
            console.log('Settings panel was closed');
            SettingsPanel.instance = null;
        });

        // معالج رسائل من SettingsPanel
        this.panel.webview.onDidReceiveMessage(async (message) => {
            console.log('Extension received message from SettingsPanel:', message);
            
            switch (message.type) {
                case WEBVIEW_MESSAGES.GET_SETTINGS:
                    // إرسال الإعدادات الحالية للـ webview
                    const settingsConfig = vscode.workspace.getConfiguration('webPageBuilder');
                    const language = settingsConfig.get<string>('language', 'auto');
                    
                    this.panel.webview.postMessage({
                        type: WEBVIEW_MESSAGES.SETTINGS_LOADED,
                        language: language
                    });
                    break;
                    
                case WEBVIEW_MESSAGES.SAVE_LANGUAGE:
                    // حفظ اللغة
                    const newLanguage = message.language as 'auto' | 'ar' | 'en';
                    console.log('Saving language:', newLanguage);
                    const settingsConfig2 = vscode.workspace.getConfiguration('webPageBuilder');
                    await settingsConfig2.update('language', newLanguage, vscode.ConfigurationTarget.Global);
                    console.log('Language saved to settings:', newLanguage);
                    
                    // تحديد اللغة الفعلية التي سيتم استخدامها
                    let actualLanguage: 'ar' | 'en';
                    if (newLanguage === 'auto') {
                        // استخدام لغة VS Code
                        const vscodeLanguage = vscode.env.language;
                        actualLanguage = vscodeLanguage.startsWith('ar') ? 'ar' : 'en';
                        console.log('Auto language detected:', actualLanguage);
                    } else {
                        actualLanguage = newLanguage;
                        console.log('Using selected language:', actualLanguage);
                    }
                    
                    // إعادة تحميل الترجمات باللغة الفعلية
                    loadLocale(actualLanguage);
                    console.log('Locale loaded:', actualLanguage);
                    
                    // إرسال رسالة تحديث الترجمات للـ sidebar
                    await vscode.commands.executeCommand('webPageBuilder.updateSidebarLocale');
                    console.log('Update sidebar locale command executed');
                    
                    // إظهار رسالة نجاح
                    const messageText = newLanguage === 'ar'
                        ? 'تم تغيير اللغة بنجاح'
                        : 'Language changed successfully';
                    vscode.window.showInformationMessage(messageText);
                    break;
            }
        });
    }

    /**
     * الحصول على محتوى HTML للإعدادات
     */
    private static async getSettingsHtml(extensionUri: vscode.Uri): Promise<string> {
        try {
            const htmlUri = vscode.Uri.joinPath(extensionUri, 'out', 'webviews', 'settingsWebview.html');
            const htmlData = await vscode.workspace.fs.readFile(htmlUri);
            
            // تحويل Uint8Array إلى نص باستخدام TextDecoder
            const decoder = new TextDecoder('utf-8');
            const htmlContent = decoder.decode(htmlData);
            
            return htmlContent;
        } catch (error) {
            console.error('Error loading settings webview files:', error);
            return `<html><body><h1>Error loading settings</h1></body></html>`;
        }
    }
}
