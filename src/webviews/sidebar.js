const vscode = acquireVsCodeApi();

function sendMessage(type, tag) {
    vscode.postMessage({
        type: type,
        tag: tag
    });
}

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
