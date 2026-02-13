# خطة تقسيم ملف extension.ts

## المشكلة
ملف [`src/extension.ts`](src/extension.ts) يحتوي على حوالي 96000 حرف، وهو كبير جداً ويصعب صيانته.

## الحل المقترح
تقسيم الملف إلى عدة ملفات منفصلة، كل ملف مسؤول عن جزء محدد من المشروع.

## الملفات المقترحة

### 1. src/constants/index.ts (موجود بالفعل)
**الوصف**: الثوابت المستخدمة في المشروع
**المحتوى**:
- أنواع الرسائل
- الثوابت العامة

### 2. src/types/index.ts (موجود بالفعل)
**الوصف**: الأنواع المشتركة في المشروع
**المحتوى**:
- واجهات البيانات
- أنواع الرسائل

### 3. src/services/editorService.ts (موجود بالفعل)
**الوصف**: خدمة المحرر
**المحتوى**:
- دوال إدارة المحرر
- دوال حفظ الكود

### 4. src/services/saveService.ts (موجود بالفعل)
**الوصف**: خدمة الحفظ
**المحتوى**:
- دوال حفظ الملفات
- دوال التصدير

### 5. src/webViewPanel.ts (موجود بالفعل)
**الوصف**: لوحة Webview الرئيسية
**المحتوى**:
- إنشاء اللوحة
- إدارة دورة حياة اللوحة

### 6. src/webviews/editorWebview.ts (موجود بالفعل)
**الوصف**: محرر الويب
**المحتوى**:
- HTML للمحرر المرئي
- دوال التفاعل

### 7. src/panels/sidebarPanel.ts (جديد)
**الوصف**: لوحة Sidebar
**المحتوى**:
- HTML للوحة Sidebar
- عرض الوسوم
- إرسال الرسائل

### 8. src/extension.ts (محدث)
**الوصف**: الملف الرئيسي للإضافة
**المحتوى**:
- دالة [`activate`](src/extension.ts:7) فقط
- الثوابت الأساسية
- تسجيل الأوامر
- تسجيل Sidebar Provider

## هيكلية الملفات الجديدة

```
src/
├── extension.ts           # الملف الرئيسي (محدث)
├── constants/
│   └── index.ts          # الثوابت
├── types/
│   └── index.ts          # الأنواع
├── services/
│   ├── editorService.ts   # خدمة المحرر
│   └── saveService.ts     # خدمة الحفظ
├── panels/
│   └── sidebarPanel.ts   # لوحة Sidebar (جديد)
└── webviews/
    ├── webViewPanel.ts      # لوحة Webview الرئيسية
    └── editorWebview.ts    # محرر الويب
```

## الخطوات

1. إنشاء ملف [`src/panels/sidebarPanel.ts`](src/panels/sidebarPanel.ts) جديد
2. نقل WebPageBuilderPanel و WebPageBuilderSidebarProvider من [`src/extension.ts`](src/extension.ts) إلى [`src/panels/sidebarPanel.ts`](src/panels/sidebarPanel.ts)
3. نقل EditorPanel من [`src/extension.ts`](src/extension.ts) إلى [`src/panels/editorPanel.ts`](src/panels/editorPanel.ts)
4. تحديث [`src/extension.ts`](src/extension.ts) ليحتوي فقط على دالة [`activate`](src/extension.ts:7) والثوابت
5. تحديث [`README.md`](README.md) ليعكس الهيكلية الجديدة

## المزايا

- **سهولة الصيانة**: كل ملف مسؤول عن جزء محدد
- **وضوح الكود**: الكود منظم وسهل الفهم
- **قابلية التوسع**: يمكن إضافة ملفات جديدة بسهولة
- **فصل المسؤوليات**: فصل واضح بين المكونات المختلفة

## التطوير المستقبلي

- [ ] إضافة مزيد من الميزات
- [ ] تحسين الأداء
- [ ] إضافة الاختبارات
