const vscode = acquireVsCodeApi();

// متغير لتخزين الترجمات الحالية
let currentLocaleStrings = null;
let currentLocale = 'ar';

function sendMessage(type, tag) {
    console.log('sendMessage called:', type, tag);
    vscode.postMessage({
        type: type,
        tag: tag
    });
}

/**
 * تغيير اللغة
 */
function changeLanguage(language) {
    vscode.postMessage({
        type: 'changeLanguage',
        language: language
    });
}

/**
 * فتح إعدادات VS Code
 */
function openVSCodeSettings() {
    vscode.postMessage({
        type: 'openSettings'
    });
}

/**
 * تحديث نصوص الواجهة حسب اللغة
 */
function updateLocaleStrings(strings, locale) {
    currentLocaleStrings = strings;
    currentLocale = locale;
    
    // تحديث اتجاه الصفحة
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    
    // تحديث جميع العناصر التي لها data-locale-key
    const elements = document.querySelectorAll('[data-locale-key]');
    elements.forEach(element => {
        const key = element.getAttribute('data-locale-key');
        const text = getLocaleText(key);
        if (text) {
            element.textContent = text;
        }
    });
}

/**
 * الحصول على نص مترجم
 */
function getLocaleText(key) {
    if (!currentLocaleStrings) {
        return null;
    }
    
    const keys = key.split('.');
    let value = currentLocaleStrings;
    
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return null;
        }
    }
    
    return typeof value === 'string' ? value : null;
}

/**
 * استقبال الرسائل من الإضافة
 */
window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.type) {
        case 'localeUpdate':
            updateLocaleStrings(message.strings, message.locale);
            // تحديث قائمة اختيار اللغة
            const languageSelect = document.getElementById('language-select');
            if (languageSelect) {
                languageSelect.value = message.locale;
            }
            break;
    }
});

// طلب الترجمات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    vscode.postMessage({
        type: 'getLocale'
    });
});

function toggleCategory(categoryId) {
    const category = document.getElementById('category-' + categoryId);
    const separator = event.currentTarget;
    
    if (category.classList.contains('collapsed')) {
        category.classList.remove('collapsed');
        separator.classList.remove('collapsed');
    } else {
        category.classList.add('collapsed');
        separator.classList.add('collapsed');
    }
}

// إنشاء وإدارة الـ Tooltip
(function() {
    // إنشاء عنصر Tooltip منفصل
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    document.body.appendChild(tooltip);

    // متغير لتخزين المؤقت الحالي
    let typingTimeout = null;

    // دالة لكتابة النص حرفًا بحرف (Typewriter effect)
    function typeText(element, text, speed) {
        let index = 0;
        element.textContent = '';
        
        function type() {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                typingTimeout = setTimeout(type, speed);
            }
        }
        
        type();
    }

    // الحصول على جميع الأزرار
    const iconButtons = document.querySelectorAll('.icon-button');

    // إضافة أحداث hover لكل زر
    iconButtons.forEach(button => {
        button.addEventListener('mouseenter', function(e) {
            // استخدام data-tooltip (علامة الوسم) فقط
            var tooltipText = this.getAttribute('data-tooltip');
            
            if (tooltipText) {
                // إيقاف أي كتابة سابقة
                if (typingTimeout) {
                    clearTimeout(typingTimeout);
                }
                
                // حساب موقع الزر بالنسبة للشاشة
                var rect = this.getBoundingClientRect();
                
                // تعيين موقع الـ Tooltip
                tooltip.style.left = (rect.left + rect.width / 2) + 'px';
                tooltip.style.top = rect.top + 'px';
                
                // إظهار الـ Tooltip
                tooltip.classList.add('visible');
                
                // كتابة علامة الوسم حرفًا بحرف
                typeText(tooltip, tooltipText, 25);
            }
        });

        button.addEventListener('mouseleave', function() {
            // إيقاف الكتابة
            if (typingTimeout) {
                clearTimeout(typingTimeout);
                typingTimeout = null;
            }
            
            // إخفاء الـ Tooltip
            tooltip.classList.remove('visible');
            
            // مسح النص بعد انتهاء الانيميشن
            setTimeout(function() {
                if (!tooltip.classList.contains('visible')) {
                    tooltip.textContent = '';
                }
            }, 400);
        });
    });
})();
