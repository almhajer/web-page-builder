import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export type LocaleKey = 'ar' | 'en';
export type LocaleStrings = typeof import('./ar.json');

let currentLocale: LocaleStrings;
let currentLocaleKey: LocaleKey;

export function getLocale(): LocaleKey {
    const config = vscode.workspace.getConfiguration('webPageBuilder');
    const languageSetting = config.get<string>('language', 'auto');
    
    if (languageSetting === 'auto') {
        // استخدام لغة VS Code
        const vscodeLanguage = vscode.env.language;
        return vscodeLanguage.startsWith('ar') ? 'ar' : 'en';
    }
    
    return languageSetting as LocaleKey;
}

export function loadLocale(localeKey?: LocaleKey): LocaleStrings {
    const key = localeKey || getLocale();
    currentLocaleKey = key;
    
    const localePath = path.join(__dirname, '..', 'locales', `${key}.json`);
    
    try {
        const content = fs.readFileSync(localePath, 'utf-8');
        currentLocale = JSON.parse(content);
        return currentLocale;
    } catch (error) {
        console.error(`Error loading locale ${key}:`, error);
        // fallback to Arabic
        const fallbackPath = path.join(__dirname, '..', 'locales', 'ar.json');
        const fallbackContent = fs.readFileSync(fallbackPath, 'utf-8');
        currentLocale = JSON.parse(fallbackContent);
        return currentLocale;
    }
}

export function t(key: string): string {
    if (!currentLocale) {
        loadLocale();
    }
    
    const keys = key.split('.');
    let value: any = currentLocale;
    
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return key; // إرجاع المفتاح إذا لم يتم العثور على الترجمة
        }
    }
    
    return typeof value === 'string' ? value : key;
}

export function getCurrentLocaleKey(): LocaleKey {
    return currentLocaleKey;
}

export { currentLocale };
