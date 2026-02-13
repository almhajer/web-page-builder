# سجل التغييرات - Web Page Builder

## [1.0.0] - 2024-02-12

### إضافة محرر الكود

#### التغييرات الجديدة

##### 1. تغيير الأسماء

- **من `tahoeEditor` إلى `Editor`**
  - **الملف:** `src/extension.ts`, `src/webViewPanel.ts` (تم تغيير الاسم من webview-panel.ts إلى webViewPanel.ts)
  - **الوصف:** تم تغيير اسم المتغير والدالة لتحسين تسمية الكود

##### 2. إضافة محرر كود احترافي

- **الوصف:** تم إضافة محرر كود احترافي باستخدام  Editor
- **الميزات:**
  - تلوين الكود تلقائياً (Syntax Highlighting)
  - دعم لغات متعددة (HTML, CSS, JavaScript)
  - اقتراحات تلقائية للكود
  - كود HTML فارغ جاهز للتعديل

##### 3. إضافة كود صفحة HTML فارغة

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

##### 4. إضافة وظيفة المزامنة الثنائية بين Editor و Webview

###### من Editor إلى Webview

1. **عند تغيير محتوى editor:**
   - يتم إرسال رسالة `updateCode` إلى extension
   - extension يستقبل الرسالة ويرسلها إلى WebPageBuilderPanel
   - WebPageBuilderPanel يرسل الرسالة `codeUpdate` إلى webview
   - webview يستقبل الرسالة ويحدث iframe بالكود الجديد

###### من Webview إلى Editor

2. **عند تغيير محتوى webview:**
   - يتم مراقبة التغييرات باستخدام MutationObserver
   - عند اكتشاف تغيير، يتم إرسال رسالة `updateEditor` إلى extension
   - extension يستقبل الرسالة ويرسلها إلى EditorPanel
   - EditorPanel يرسل الرسالة `updateEditorValue` إلى editor
   - editor يستقبل الرسالة ويحدث قيمة المحرر بالكود الجديد

##### 5. إضافة حدث onDidChangeViewState

- **الوصف:** عند إعادة تنشيط tab webview، يتم إرسال رسالة `requestCurrentCode` إلى EditorPanel
- **الوظيفة:** طلب الكود الحالي من editor وعرضه في webview

##### 6. إنشاء متغير عام لـ EditorPanel

- **الوصف:** متغير عام للوصول إليه من WebPageBuilderPanel
- **الملف:** `src/extension.ts`

##### 7. تنظيف الكود

- **الوصف:** تم إزالة console.log غير الضرورية
- **التحسينات:**
  - إضافة تعليقات توضح عمل كل قسم
  - تنظيف الكود من كل شيء لا يستخدم

##### 8. تحديث التوثيق

- **الملفات:** `README.md`, `CHANGELOG.md`
- **الوصف:** تم تحديث التوثيق ليعكس التغييرات الجديدة

## الملفات التي تم تعديلها

1. `src/extension.ts` - تم تعديل الأسماء وإضافة وظيفة المزامنة
2. `src/webViewPanel.ts` - تم تعديل الأسماء (تم تغيير الاسم من webview-panel.ts إلى webViewPanel.ts)
3. `README.md` - تم إعادة كتابة README.md بشكل أفضل وأكثر شمولاً
4. `CHANGELOG.md` - تم إنشاء ملف سجل التغييرات

## الميزات الجديدة

1. **محرر كود احترافي** -  Editor مع تلوين الكود تلقائياً
2. **مزامنة ثنائية** - أي تغيير في editor أو webview يظهر فوراً في الطرف الآخر
3. **كود HTML فارغة** - قيمة افتراضية جاهزة للتعديل
4. **إعادة تحميل الكود** - عند إعادة فتح webview، يتم تحميل الكود الحالي من editor

## كيفية الاستخدام

### استخدام المحرر (Editor)

1. افتح Visual Studio Code
2. سيتم فتح المحرر تلقائياً عند تفعيل الإضافة
3. اكتب كود HTML/CSS/JavaScript في المحرر
4. استفد من تلوين الكود تلقائياً
5. استفد من الاقتراحات التلقائية

### استخدام المعاينة (Webview)

1. افتح تبويب "Webviews" من شريط النشاط (Activity Bar)
2. سيتم عرض معاينة فورية للكود المكتوب في المحرر
3. أي تغيير في المحرر سيظهر فوراً في المعاينة
4. أي تغيير في المعاينة سيظهر فوراً في المحرر

### استخدام السايد بار (Sidebar)

1. اضغط على أيقونة "Web Page Builder" في شريط النشاط (Activity Bar)
2. استخدم الأزرار في السايد بار لإنشاء مشروع جديد أو فتح ملفات المصادر
3. استفد من قائمة الوسوم والأدوات المتاحة

## الملاحظات

- تم استخدام `isUpdatingFromEditor` لتجنب الحلقات اللانهائية في المزامنة الثنائية
- تم استخدام  Editor لمحرر الكود الاحترافي
- تم استخدام MutationObserver لمراقبة التغييرات في webview
