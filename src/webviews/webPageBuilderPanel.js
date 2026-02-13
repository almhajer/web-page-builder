const vscode = acquireVsCodeApi();

// جعل body قابل للتعديل
document.body.contentEditable = 'true';

// متغيرات لتتبع العنصر المحدد
let selectedElement = null;
let isDragging = false;
let isResizing = false;
let resizeHandle = null;
let startX, startY, startWidth, startHeight, startLeft, startTop;

// القيمة الافتراضية
const defaultHtml = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صفحة</title>
</head>
<body>

</body>
</html>`;

// تحويل HTML إلى محتوى قابل للتعديل
function htmlToEditable(html) {
    // استخراج محتوى body من HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const bodyContent = doc.body.innerHTML;
    return bodyContent;
}

// تحويل المحتوى القابل للتعديل إلى HTML
function editableToHtml(content) {
    // تنظيف المحتوى من الأسطر الفارغة في البداية والنهاية
    let cleanedContent = content.trim();
    
    // إزالة مقابض التغيير الحجم قبل الحفظ
    cleanedContent = cleanedContent.replace(/class="resizable-element selected"/g, '');
    cleanedContent = cleanedContent.replace(/class="resizable-element"/g, '');
    cleanedContent = cleanedContent.replace(/<div class="resize-handle[^"]*"><\/div>/g, '');
    cleanedContent = cleanedContent.replace(/style="[^"]*position:\s*relative;[^"]*"/g, '');
    
    return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صفحة</title>
</head>
<body>
${cleanedContent}
</body>
</html>`;
}

// إضافة مقابض التغيير الحجم للعنصر
function addResizeHandles(element) {
    // إزالة المقابض القديمة
    removeResizeHandles();
    
    // إضافة class للعنصر
    element.classList.add('resizable-element', 'selected');
    
    // إضافة مقابض التغيير الحجم
    const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
    handles.forEach(handle => {
        const div = document.createElement('div');
        div.className = `resize-handle ${handle}`;
        div.dataset.handle = handle;
        element.appendChild(div);
    });
    
    // جعل العنصر قابل للتحريك
    if (!element.style.position || element.style.position === 'static') {
        element.style.position = 'relative';
    }
}

// إزالة مقابض التغيير الحجم
function removeResizeHandles() {
    const selectedElements = document.querySelectorAll('.resizable-element');
    selectedElements.forEach(el => {
        el.classList.remove('resizable-element', 'selected');
        const handles = el.querySelectorAll('.resize-handle');
        handles.forEach(handle => handle.remove());
    });
}

// التعامل مع النقر على العناصر
document.addEventListener('click', (e) => {
    const target = e.target;
    
    // تجاهل النقر على المقابض
    if (target.classList.contains('resize-handle')) {
        return;
    }
    
    // إزالة التحديد السابق
    removeResizeHandles();
    
    // تحديد العنصر الجديد
    if (target !== document.body && !target.classList.contains('resize-handle')) {
        selectedElement = target;
        addResizeHandles(target);
        e.preventDefault();
        e.stopPropagation();
    } else {
        selectedElement = null;
    }
}, true);

// التعامل مع السحب والإفلات
document.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('resize-handle')) {
        isResizing = true;
        resizeHandle = e.target.dataset.handle;
        selectedElement = e.target.parentElement;
        
        startX = e.clientX;
        startY = e.clientY;
        startWidth = selectedElement.offsetWidth;
        startHeight = selectedElement.offsetHeight;
        startLeft = selectedElement.offsetLeft;
        startTop = selectedElement.offsetTop;
        
        e.preventDefault();
        e.stopPropagation();
    } else if (selectedElement && !e.target.classList.contains('resize-handle')) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = selectedElement.offsetLeft;
        startTop = selectedElement.offsetTop;
        
        e.preventDefault();
        e.stopPropagation();
    }
});

document.addEventListener('mousemove', (e) => {
    if (isResizing && selectedElement) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        switch (resizeHandle) {
            case 'se':
                selectedElement.style.width = (startWidth + dx) + 'px';
                selectedElement.style.height = (startHeight + dy) + 'px';
                break;
            case 'sw':
                selectedElement.style.width = (startWidth - dx) + 'px';
                selectedElement.style.height = (startHeight + dy) + 'px';
                selectedElement.style.left = (startLeft + dx) + 'px';
                break;
            case 'ne':
                selectedElement.style.width = (startWidth + dx) + 'px';
                selectedElement.style.height = (startHeight - dy) + 'px';
                selectedElement.style.top = (startTop + dy) + 'px';
                break;
            case 'nw':
                selectedElement.style.width = (startWidth - dx) + 'px';
                selectedElement.style.height = (startHeight - dy) + 'px';
                selectedElement.style.left = (startLeft + dx) + 'px';
                selectedElement.style.top = (startTop + dy) + 'px';
                break;
            case 'n':
                selectedElement.style.height = (startHeight - dy) + 'px';
                selectedElement.style.top = (startTop + dy) + 'px';
                break;
            case 's':
                selectedElement.style.height = (startHeight + dy) + 'px';
                break;
            case 'e':
                selectedElement.style.width = (startWidth + dx) + 'px';
                break;
            case 'w':
                selectedElement.style.width = (startWidth - dx) + 'px';
                selectedElement.style.left = (startLeft + dx) + 'px';
                break;
        }
    } else if (isDragging && selectedElement) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        selectedElement.style.left = (startLeft + dx) + 'px';
        selectedElement.style.top = (startTop + dy) + 'px';
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
    resizeHandle = null;
});

// تعيين القيمة الافتراضية
document.body.innerHTML = htmlToEditable(defaultHtml);

// الاستماع للرسائل من Extension - تحديث المحرر المرئي بالكود من Editor
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
        case 'codeUpdate':
            document.body.innerHTML = htmlToEditable(message.code);
            break;
        case 'requestCurrentCodeFromWebview':
            // إرسال الكود الحالي من المحرر المرئي إلى Editor
            const currentHtml = editableToHtml(document.body.innerHTML);
            vscode.postMessage({
                type: 'sendCurrentCodeToEditor',
                code: currentHtml
            });
            break;
        case 'insertTag':
            // إضافة الوسم إلى المحتوى
            const tag = message.tag;
            const tagElement = document.createElement(tag);
            
            // إضافة محتوى افتراضي لبعض الوسوم
            if (tag === 'p') {
                tagElement.textContent = 'نص جديد';
            } else if (tag === 'div') {
                tagElement.style.width = '200px';
                tagElement.style.height = '100px';
                tagElement.style.border = '1px solid #ccc';
                tagElement.textContent = 'Div جديد';
            } else if (tag === 'img') {
                tagElement.src = 'https://via.placeholder.com/200x100';
                tagElement.alt = 'صورة';
            } else if (tag === 'a') {
                tagElement.href = '#';
                tagElement.textContent = 'رابط';
            } else if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
                tagElement.textContent = `عنوان ${tag.toUpperCase()}`;
            } else if (tag === 'button') {
                tagElement.textContent = 'زر';
                tagElement.type = 'button';
            } else if (tag === 'input') {
                tagElement.type = 'text';
                tagElement.placeholder = 'نص';
            } else if (tag === 'textarea') {
                tagElement.placeholder = 'نص طويل';
                tagElement.rows = 4;
                tagElement.cols = 50;
            } else if (tag === 'table') {
                tagElement.style.border = '1px solid #ccc';
                tagElement.style.borderCollapse = 'collapse';
                tagElement.innerHTML = '<tr><td>خلية 1</td><td>خلية 2</td></tr><tr><td>خلية 3</td><td>خلية 4</td></tr>';
            } else if (tag === 'ul' || tag === 'ol') {
                const li = document.createElement('li');
                li.textContent = 'عنصر قائمة';
                tagElement.appendChild(li);
            }
            
            // إضافة العنصر إلى body
            document.body.appendChild(tagElement);
            
            // تحديد العنصر المضاف
            removeResizeHandles();
            selectedElement = tagElement;
            addResizeHandles(tagElement);
            break;
    }
});
