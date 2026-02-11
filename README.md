# Web Page Builder

أداة بناء صفحات ويب تفاعلية لـ Visual Studio Code

## الوصف

إضافة Visual Studio Code لبناء صفحات الويب بشكل تفاعلي وسريع.

## الإصدار

0.0.0

## الميزات

- واجهة سايد بار تفاعلية
- إنشاء مشاريع جديدة
- فتح ملفات المصادر
- واجهة مستخدم عربية

## التثبيت

1. قم بتثبيت المكتبات المطلوبة:
```bash
npm install
```

2. قم بتجميع المشروع:
```bash
npm run compile
```

3. قم بتشغيل المشروع في وضع التطوير:
```bash
code --extensionDevelopmentPath=/path/to/web-page-builder
```

## البناء

لإنشاء ملف `.vsix` للتثبيت:

```bash
npm install -g @vscode/vsce
vsce package
```

## الاستخدام

1. افتح Visual Studio Code
2. اضغط على أيقونة "Web Page Builder" في شريط النشاط (Activity Bar)
3. استخدم الأزرار في السايد بار لإنشاء مشروع جديد أو فتح ملفات المصادر

## التطوير

- `npm run compile` - تجميع ملفات TypeScript
- `npm run watch` - تجميع مع مراقبة التغييرات
- `npm run lint` - فحص الكود

## الترخيص

MIT
