# Web Page Builder

مشروع VSCode Extension لبناء صفحات HTML بسهولة.

## الميزات

### 1. محرر الكود (Editor)
- محرر Monaco Editor مدمج في VSCode
- يدعم تمييز الكود (Syntax Highlighting)
- يدعم الإكمال التلقائي (Auto-completion)
- يدعم التنسيق (Formatting)

### 2. المحرر المرئي (Webview)
- محرر مرئي قابل للتعديل مباشرة
- جعل `body` قابل للتعديل باستخدام `contentEditable`
- دعم تحرير الموقع والحجم للعناصر
- دعم إضافة الوسوم من sidebar

### 3. التبديل بين المحررين
- عند التبديل بين Editor و Webview، يتم إرسال HTML من التبويب النشط إلى التبويب الآخر
- لا يتم التزامن التلقائي عند التغيير

## هيكلية المشروع

### الملفات الرئيسية

```
src/
├── extension.ts           # الملف الرئيسي للإضافة
├── webViewPanel.ts       # لوحة Webview
├── webviews/
│   └── editorWebview.ts  # محرر الويب
├── services/
│   ├── editorService.ts    # خدمة المحرر
│   └── saveService.ts      # خدمة الحفظ
├── constants/
│   ├── index.ts           # الثوابت
│   └── messages.ts        # رسائل النظام
├── types/
│   └── index.ts           # الأنواع
└── utils/
    └── asyncUtils.ts       # أدوات غير متزامنة
```

### المكونات

#### 1. EditorPanel
**الموقع**: [`src/extension.ts`](src/extension.ts:9)
**الوصف**: محرر Monaco Editor مدمج في VSCode
**الوظائف**:
- تحرير كود HTML
- إرسال الكود إلى Webview عند التغيير (تم تعطيله)
- استلام الكود من Webview عند التنشيط
- استلام طلبات الكود من Webview

#### 2. WebPageBuilderPanel
**الموقع**: [`src/extension.ts`](src/extension.ts:1719)
**الوصف**: لوحة Webview تعرض المحرر المرئي
**الوظائف**:
- عرض المحرر المرئي
- استلام الكود من EditorPanel
- إرسال الكود إلى EditorPanel عند التنشيط
- تمرير الرسائل من sidebar إلى المحرر المرئي

### الميزات التفاعلية

#### 1. تحرير الموقع والحجم
- عند النقر على أي عنصر، تظهر مقابض (handles) حوله
- يمكن سحب العنصر لتغيير موقعه
- يمكن تكبير وتصغير العنصر باستخدام المقابض

#### 2. إضافة الوسوم من sidebar
- عند الضغط على أي tag في جدول عرض الوسوم، يتم إضافته إلى Webview
- يتم إضافة محتوى افتراضي مناسب لكل نوع وسم

### الرسائل

#### من EditorPanel إلى WebPageBuilderPanel
- `updateCode`: إرسال الكود المحدث من المحرر
- `requestCodeFromWebview`: طلب الكود الحالي من Webview

#### من WebPageBuilderPanel إلى EditorPanel
- `sendCurrentCodeToEditor`: إرسال الكود الحالي من المحرر المرئي
- `insertTag`: إضافة وسم HTML جديد

#### من WebPageBuilderPanel إلى Webview
- `codeUpdate`: تحديث المحرر المرئي بالكود من EditorPanel
- `requestCurrentCodeFromWebview`: طلب الكود الحالي من المحرر المرئي
- `insertTag`: إضافة وسم HTML جديد

### الأنواع

```typescript
// أنواع البيانات المشتركة
interface Message {
    type: string;
    code?: string;
    tag?: string;
    requestId?: string;
}
```

### الثوابت

```typescript
// الثوابت المستخدمة في المشروع
const VIEW_TYPE = 'webPageBuilder.webviews';
const EDITOR_VIEW_TYPE = 'Editor';
```

## التثبيت

```bash
# تثبيت الحزم
npm install

# بناء المشروع
npm run compile

# تشغيل الإضافة في وضع التطوير
npm run watch
```

## التطوير المستقبلي

- [ ] إضافة مزيد من الوسوم HTML
- [ ] تحسين واجهة المستخدم
- [ ] إضافة دعم السحب والإفلات
- [ ] تحسين الأداء

## الترخيص

MIT License
