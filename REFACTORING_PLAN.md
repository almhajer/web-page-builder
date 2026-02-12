# خطة إعادة هيكلة المشروع

## الهدف
تقسيم ملف `src/extension.ts` (1899 سطر) إلى ملفات أصغر منظمة مع تعليقات واضحة لكل قسم.

## الهيكل المقترح

```
src/
├── extension.ts                    (ملف رئيسي - ~200 سطر)
├── types/
│   └── index.ts                (أنواع TypeScript)
├── constants/
│   ├── index.ts                (الثوابت)
│   └── messages.ts             (أنواع الرسائل)
├── services/
│   ├── editorService.ts         (خدمة المحرر)
│   ├── saveService.ts           (خدمة الحفظ)
│   └── webviewService.ts        (خدمة Webview)
├── panels/
│   ├── editorPanel.ts           (لوحة المحرر)
│   └── webPageBuilderPanel.ts   (لوحة WebPageBuilder)
├── commands/
│   └── index.ts                (تسجيل الأوامر)
└── utils/
    ├── logger.ts                (السجلات)
    └── helpers.ts               (الدوال المساعدة)
```

## تقسيم الملفات

### 1. `src/types/index.ts`
- تعريف الأنواع المستخدمة في المشروع
- واجهات TypeScript
- أنواع الرسائل

### 2. `src/constants/index.ts`
- الثوابت المستخدمة في المشروع
- أسماء الأوامر
- قيم التكوين

### 3. `src/constants/messages.ts`
- أنواع الرسائل بين Extension و Webview
- ثوابت الرسائل

### 4. `src/services/editorService.ts`
- إدارة EditorPanel
- إنشاء وعرض المحرر
- إرسال واستلام الرسائل من المحرر

### 5. `src/services/saveService.ts`
- دالة حفظ باسم
- إدارة عملية الحفظ
- معالجة الأخطاء

### 6. `src/services/webviewService.ts`
- إدارة WebPageBuilderPanel
- إنشاء وعرض الـ Webview
- إرسال واستلام الرسائل من الـ Webview

### 7. `src/panels/editorPanel.ts`
- إنشاء لوحة المحرر
- إعداد المحتوى HTML
- إدارة أحداث المحرر

### 8. `src/panels/webPageBuilderPanel.ts`
- إنشاء لوحة WebPageBuilder
- إعداد المحتوى HTML
- إدارة أحداث الـ Webview

### 9. `src/commands/index.ts`
- تسجيل جميع الأوامر
- دالة `activate` الرئيسية
- دالة `deactivate`

### 10. `src/utils/logger.ts`
- دوال السجلات
- مستويات السجلات
- تنسيق الرسائل

### 11. `src/utils/helpers.ts`
- دوال مساعدة عامة
- دوال التحقق
- دوال التحويل

## المزايا

1. **تنظيم أفضل**: كل ملف له مسؤولية واحدة واضحة
2. **قابلية الصيانة**: سهل تحديث الملفات الفردية
3. **قابلية الاختبار**: سهل اختبار كل مكون بشكل منفصل
4. **قابلية القراءة**: سهل فهم الكود بفضل التعليقات الواضحة
5. **إعادة الاستخدام**: يمكن إعادة استخدام المكونات في مشاريع أخرى

## الخطوات

1. إنشاء المجلدات والملفات الجديدة
2. نقل الكود المناسب لكل ملف
3. إضافة التعليقات والوثائق
4. تحديث `src/extension.ts` لاستيراد الملفات الجديدة
5. اختبار التغييرات
6. إنشاء commit
7. إرسال إلى GitHub
