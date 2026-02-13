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

    private constructor(panel: vscode.WebviewPanel) {
        this.panel = panel;
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
        panel.webview.html = await this.getSettingsHtml();

        SettingsPanel.instance = new SettingsPanel(panel);
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
                    const settingsConfig2 = vscode.workspace.getConfiguration('webPageBuilder');
                    await settingsConfig2.update('language', newLanguage, vscode.ConfigurationTarget.Global);
                    
                    // إعادة تحميل الترجمات
                    if (newLanguage !== 'auto') {
                        loadLocale(newLanguage);
                    } else {
                        loadLocale(getLocale());
                    }
                    
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
    private static async getSettingsHtml(): Promise<string> {
        try {
            const htmlPath = path.join(__dirname, '..', 'webviews', 'settingsWebview.html');
            const htmlContent = await readFile(htmlPath, 'utf8');
            return htmlContent;
        } catch (error) {
            console.error('Error loading settings webview files:', error);
            return `<html><body><h1>Error loading settings</h1></body></html>`;
        }
    }
}
