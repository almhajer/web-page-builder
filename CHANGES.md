# سجل التغييرات - Web Page Builder

## التغييرات التي تم إجراؤها

### 1. تغيير الأسماء

#### من `tahoeEditorPanel` إلى `EditorPanel`
- **الملف:** `src/extension.ts`
- **السطر:** 8
- **الوصف:** تم تغيير اسم المتغير `tahoeEditorPanel` إلى `EditorPanel` لتحسين تسمية الكود

#### من `tahoeEditor` إلى `Editor`
- **الملف:** `src/webview-panel.ts`
- **السطر:** 12
- **الوصف:** تم تغيير اسم الدالة `createTahoeEditorWebviewPanel` إلى `createEditorWebviewPanel` وتم تحديث `viewType` من `'tahoeEditor'` إلى `'Editor'`

### 2. إضافة خاصية تلوين الكود (Syntax Highlighting)

- **الوصف:** تم إضافة خاصية تلوين الكود تلقائياً باستخدام محرر الأكواد المتقدم
- **الميزات:**
  - تلوين الكلمات المفتاحية (keywords) باللون الأزرق
  - تلوين النصوص (strings) باللون البرتقالي
  - تلوين الأرقام (numbers) باللون الأخضر الفاتح
  - تلوين التعليقات (comments) باللون الأخضر الداكن
  - تلوين الدوال (functions) باللون الأصفر
  - تلوين المتغيرات (variables) باللون الأزرق الفاتح
  - تلوين الفئات (class names) باللون التركواز
  - تلوين العمليات (operators) باللون الرمادي

### 3. إضافة كود صفحة HTML فارغة

- **الوصف:** تم إضافة كود صفحة HTML فارغة كقيمة افتراضية في المحرر
- **المحتوى:**
  ```html
  <!DOCTYPE html>
  <html lang="en" dir="ltr">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>صفحة</title>
  </head>
  <body>
      
  </body>
  </html>
  ```

### 4. إضافة وظيفة المزامنة الثنائية بين Editor و Webview

#### من Editor إلى Webview

1. **عند تغيير محتوى editor:**
   - يتم إرسال رسالة `updateCode` إلى extension
   - extension يستقبل الرسالة ويرسلها إلى WebPageBuilderPanel
   - WebPageBuilderPanel يرسل الرسالة `codeUpdate` إلى webview
   - webview يستقبل الرسالة ويحدث iframe بالكود الجديد

#### من Webview إلى Editor

2. **عند تغيير محتوى webview:**
   - يتم مراقبة التغييرات باستخدام MutationObserver
   - عند اكتشاف تغيير، يتم إرسال رسالة `updateEditor` إلى extension
   - extension يستقبل الرسالة ويرسلها إلى EditorPanel
   - EditorPanel يرسل الرسالة `updateEditorValue` إلى editor
   - editor يستقبل الرسالة ويحدث قيمة المحرر بالكود الجديد

#### كيف تعمل المزامنة الثنائية

- **Editor ↔ Extension ↔ Webview (iframe)**
- أي تغيير في editor يظهر فوراً في webview
- أي تغيير في webview يظهر فوراً في editor
- تم استخدام `isUpdatingFromEditor` لتجنب الحلقات اللانهائية

### 5. إصلاح دالة "حفظ باسم"

- **الوصف:** تم إصلاح مشكلة دالة "حفظ باسم" التي كانت لا تحصل على البيانات من المحرر بشكل صحيح
- **الملف:** `src/extension.ts`
- **السطور:** 168-310 تقريباً
- **المشكلة:** كانت الدالة ترسل طلب `requestCurrentCode` بعد إنشاء Promise، مما يؤدي إلى عدم وصول الرسالة إلى الـ webview
- **الحل:**
  - إعادة ترتيب العمليات: إنشاء Promise أولاً ثم إرسال الرسالة
  - زيادة المهلة الزمنية من 5 ثوانٍ إلى 15 ثانية
  - إضافة حلقة تكرار (retry loop) بحد أقصى 3 محاولات
  - استخدام `vscode.workspace.fs.writeFile` بدلاً من `fs.writeFile`
  - تبسيط الكود في الـ webview وإزالة الدوال غير المستخدمة
- **الميزات:**
  - التحقق من وجود `EditorPanel` قبل البدء
  - إظهار `EditorPanel` للتأكد من نشاطه
  - الانتظار حتى يصبح الـ webview جاهزاً (500ms)
  - إنشاء `requestId` فريد لكل طلب
  - معالجة الأخطاء بشكل شامل
  - إضافة سجلات تشخيصية لتسهيل تتبع المشكلات

## الملفات التي تم تعديلها

1. `src/extension.ts` - تم تعديل الأسماء وإضافة وظيفة المزامنة وإصلاح دالة "حفظ باسم"
2. `src/webview-panel.ts` - تم تعديل الأسماء

## الميزات الجديدة

1. **تلوين الكود تلقائياً** - يتم توفيره بواسطة  Editor
2. **مزامنة ثنائية** - أي تغيير في editor أو webview يظهر فوراً في الطرف الآخر
3. **كود HTML فارغة** - قيمة افتراضية جاهزة للتعديل
4. **حفظ باسم** - دالة محسّنة للحصول على البيانات من المحرر وحفظها في ملف
