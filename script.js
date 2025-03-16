// HTML to JSX Converter
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const htmlInput = document.getElementById('htmlInput');
    const jsxOutput = document.getElementById('jsxOutput');
    const convertBtn = document.getElementById('convertBtn');
    const copyJsxBtn = document.getElementById('copyJsx');
    const clearHtmlBtn = document.getElementById('clearHtml');
    const pasteHtmlBtn = document.getElementById('pasteHtml');
    const loadExampleBtn = document.getElementById('loadExample');
    const downloadJsxBtn = document.getElementById('downloadJsx');
    const prettifyJsxBtn = document.getElementById('prettifyJsx');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    const notificationClose = document.getElementById('notificationClose');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const htmlLineNumbers = document.getElementById('htmlLineNumbers');
    const jsxLineNumbers = document.getElementById('jsxLineNumbers');
    const themeToggle = document.getElementById('themeToggle');

    // Line numbers on initial load
    updateLineNumbers(htmlInput, htmlLineNumbers);
    updateLineNumbers(jsxOutput, jsxLineNumbers);

    // Event listeners for converter functionality
    convertBtn.addEventListener('click', convertHtmlToJsx);
    copyJsxBtn.addEventListener('click', copyJsxToClipboard);
    clearHtmlBtn.addEventListener('click', clearHtml);
    pasteHtmlBtn.addEventListener('click', pasteHtmlFromClipboard);
    loadExampleBtn.addEventListener('click', loadHtmlExample);
    downloadJsxBtn.addEventListener('click', downloadJsxFile);
    prettifyJsxBtn.addEventListener('click', prettifyJsxCode);
    notificationClose.addEventListener('click', closeNotification);
    themeToggle.addEventListener('click', toggleTheme);

    // Input/textarea events
    htmlInput.addEventListener('input', function() {
        updateLineNumbers(htmlInput, htmlLineNumbers);
    });
    
    htmlInput.addEventListener('scroll', function() {
        htmlLineNumbers.scrollTop = htmlInput.scrollTop;
    });
    
    jsxOutput.addEventListener('scroll', function() {
        jsxLineNumbers.scrollTop = jsxOutput.scrollTop;
    });

    // Load saved theme preference
    loadThemePreference();

    // Main conversion function
    function convertHtmlToJsx() {
        const html = htmlInput.value.trim();
        
        if (!html) {
            showNotification('Please enter some HTML code first', 'warning');
            return;
        }

        // Show loading indicator
        loadingIndicator.style.display = 'block';
        convertBtn.querySelector('span').textContent = 'Converting...';
        
        // Use setTimeout to allow the UI to update before processing
        setTimeout(() => {
            try {
                const jsx = htmlToJsx(html);
                jsxOutput.value = jsx;
                updateLineNumbers(jsxOutput, jsxLineNumbers);
                showNotification('HTML successfully converted to JSX!', 'success');
            } catch (error) {
                console.error('Conversion error:', error);
                showNotification('Error converting HTML to JSX: ' + error.message, 'error');
            } finally {
                // Hide loading indicator
                loadingIndicator.style.display = 'none';
                convertBtn.querySelector('span').textContent = 'Convert to JSX';
            }
        }, 100);
    }

    // HTML to JSX conversion logic
    function htmlToJsx(html) {
        // Replace HTML comments with JSX comments
        html = html.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');
        
        // Self-closing tags handling
        const selfClosingTags = [
            'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 
            'link', 'meta', 'param', 'source', 'track', 'wbr'
        ];
        
        selfClosingTags.forEach(tag => {
            // Match both versions: <tag> and <tag attr="value">
            const regex1 = new RegExp(`<(${tag})([^>]*)>`, 'gi');
            html = html.replace(regex1, '<$1$2 />');
        });
        
        // Handle attribute conversions
        const attrReplacements = [
            { from: /\bclass=/gi, to: 'className=' },
            { from: /\bfor=/gi, to: 'htmlFor=' },
            { from: /\btabindex=/gi, to: 'tabIndex=' },
            { from: /\bautocomplete=/gi, to: 'autoComplete=' },
            { from: /\bautofocus=/gi, to: 'autoFocus=' },
            { from: /\bspellcheck=/gi, to: 'spellCheck=' },
            { from: /\bmaxlength=/gi, to: 'maxLength=' },
            { from: /\bminlength=/gi, to: 'minLength=' },
            { from: /\breadonly=/gi, to: 'readOnly=' },
            { from: /\bsrcdoc=/gi, to: 'srcDoc=' },
            { from: /\bsrcset=/gi, to: 'srcSet=' },
            // Event handlers
            { from: /\bonclick=/gi, to: 'onClick=' },
            { from: /\bonchange=/gi, to: 'onChange=' },
            { from: /\bonsubmit=/gi, to: 'onSubmit=' },
            { from: /\bonkeydown=/gi, to: 'onKeyDown=' },
            { from: /\bonkeyup=/gi, to: 'onKeyUp=' },
            { from: /\bonkeypress=/gi, to: 'onKeyPress=' },
            { from: /\bonblur=/gi, to: 'onBlur=' },
            { from: /\bonfocus=/gi, to: 'onFocus=' },
            { from: /\bonscroll=/gi, to: 'onScroll=' },
            { from: /\bonload=/gi, to: 'onLoad=' },
            { from: /\bonerror=/gi, to: 'onError=' },
            { from: /\bonmousedown=/gi, to: 'onMouseDown=' },
            { from: /\bonmouseup=/gi, to: 'onMouseUp=' },
            { from: /\bonmousemove=/gi, to: 'onMouseMove=' },
            { from: /\bonmouseenter=/gi, to: 'onMouseEnter=' },
            { from: /\bonmouseleave=/gi, to: 'onMouseLeave=' },
            { from: /\bonmouseover=/gi, to: 'onMouseOver=' },
            { from: /\bonmouseout=/gi, to: 'onMouseOut=' }
        ];
        
        attrReplacements.forEach(({ from, to }) => {
            html = html.replace(from, to);
        });
        
        // Convert inline styles
        html = html.replace(/style="([^"]*)"/gi, function(match, styles) {
            if (!styles.trim()) return 'style={{}}';
            
            // Parse the style string into a JSX object
            const styleObj = styles.split(';')
                .filter(style => style.trim())
                .map(style => {
                    let [property, value] = style.split(':').map(s => s.trim());
                    if (!property) return '';
                    
                    // Convert kebab-case to camelCase
                    const camelCaseProp = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                    
                    // Handle numeric values
                    if (/^[\d.]+px$/.test(value)) {
                        value = value.replace('px', '');
                    } else if (/^[\d.]+%$/.test(value)) {
                        value = `"${value}"`;
                    } else if (/^[\d.]+$/.test(value)) {
                        // Keep as is, it's a number without units
                    } else {
                        value = `"${value}"`;
                    }
                    
                    return `${camelCaseProp}: ${value}`;
                })
                .filter(Boolean)
                .join(', ');
            
            return `style={{${styleObj}}}`;
        });
        
        // Handle boolean attributes with no values
        const booleanAttrs = ['checked', 'selected', 'disabled', 'readonly', 'required', 'autofocus', 'multiple', 'hidden'];
        booleanAttrs.forEach(attr => {
            const jsxAttr = attr === 'readonly' ? 'readOnly' : 
                          attr === 'autofocus' ? 'autoFocus' : attr;
            
            // Match the attribute with no value or with empty value
            const regex1 = new RegExp(`\\s${attr}(?=[\\s>])`, 'gi');
            const regex2 = new RegExp(`\\s${attr}=""`, 'gi');
            const regex3 = new RegExp(`\\s${attr}=''`, 'gi');
            
            html = html.replace(regex1, ` ${jsxAttr}={true}`);
            html = html.replace(regex2, ` ${jsxAttr}={true}`);
            html = html.replace(regex3, ` ${jsxAttr}={true}`);
        });
        
        return html;
    }

    // Copy JSX to clipboard
    function copyJsxToClipboard() {
        const jsx = jsxOutput.value.trim();
        
        if (!jsx) {
            showNotification('No JSX code to copy', 'warning');
            return;
        }
        
        // Use the modern navigator.clipboard API with fallback
        if (navigator.clipboard) {
            navigator.clipboard.writeText(jsx)
                .then(() => {
                    showNotification('JSX code copied to clipboard!', 'success');
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                    fallbackCopy();
                });
        } else {
            fallbackCopy();
        }
        
        // Fallback copy method
        function fallbackCopy() {
            jsxOutput.select();
            jsxOutput.setSelectionRange(0, 99999);
            
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    showNotification('JSX code copied to clipboard!', 'success');
                } else {
                    showNotification('Failed to copy to clipboard', 'error');
                }
            } catch (err) {
                console.error('Fallback copy failed: ', err);
                showNotification('Failed to copy to clipboard', 'error');
            }
            
            // Deselect
            window.getSelection().removeAllRanges();
        }
    }

    // Clear HTML input
    function clearHtml() {
        htmlInput.value = '';
        updateLineNumbers(htmlInput, htmlLineNumbers);
        showNotification('HTML input cleared', 'success');
    }

    // Paste HTML from clipboard
    function pasteHtmlFromClipboard() {
        if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText()
                .then(text => {
                    htmlInput.value = text;
                    updateLineNumbers(htmlInput, htmlLineNumbers);
                    showNotification('HTML pasted from clipboard', 'success');
                })
                .catch(err => {
                    console.error('Failed to read clipboard: ', err);
                    showNotification('Failed to paste from clipboard. Please check permissions or paste manually.', 'error');
                });
        } else {
            showNotification('Clipboard access not supported in your browser. Please paste manually.', 'warning');
        }
    }

    // Load HTML example
    function loadHtmlExample() {
        const example = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Example HTML</title>
    <style>
        .container { padding: 20px; }
    </style>
</head>
<body>
    <!-- This is a comment that will be converted properly -->
    <div class="container" style="background-color: #f0f0f0; border: 1px solid #ddd; padding: 15px;">
        <h1 style="color: #333; font-size: 24px; margin-bottom: 10px;">Hello World</h1>
        <p class="description" tabindex="0">This is a <strong>paragraph</strong> with <em>emphasis</em>.</p>
        <img src="example.jpg" alt="Example image" width="300" height="200">
        <form onsubmit="handleSubmit()">
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" required>
            <button type="submit" class="btn" onclick="validate()" disabled>Submit</button>
        </form>
        <ul data-items="3">
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
        </ul>
    </div>
</body>
</html>`;
        
        htmlInput.value = example;
        updateLineNumbers(htmlInput, htmlLineNumbers);
        showNotification('Example HTML loaded', 'success');
    }

    // Download JSX as file
    function downloadJsxFile() {
        const jsx = jsxOutput.value.trim();
        
        if (!jsx) {
            showNotification('No JSX code to download', 'warning');
            return;
        }
        
        // Create file and download
        const blob = new Blob([jsx], { type: 'text/jsx' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted.jsx';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        showNotification('JSX file downloaded', 'success');
    }

    // Prettify JSX code
    function prettifyJsxCode() {
        const jsx = jsxOutput.value.trim();
        
        if (!jsx) {
            showNotification('No JSX code to prettify', 'warning');
            return;
        }
        
        try {
            // Basic indentation prettifier
            const prettified = basicPrettify(jsx);
            jsxOutput.value = prettified;
            updateLineNumbers(jsxOutput, jsxLineNumbers);
            showNotification('JSX code prettified', 'success');
        } catch (error) {
            console.error('Prettify error:', error);
            showNotification('Error prettifying JSX code', 'error');
        }
    }

    // Basic code prettify function
    function basicPrettify(code) {
        let indentLevel = 0;
        let result = '';
        let inTag = false;
        let inComment = false;
        let inString = false;
        let stringChar = '';
        let inJSXExpression = false;
        let lastChar = '';
        
        // Split the code into lines
        const lines = code.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;
            
            // Create a properly indented line
            let indentedLine = '  '.repeat(indentLevel);
            
            // Handle specific formatting cases
            if (line.match(/<\/[a-z0-9]+>/i)) {
                // Closing tag on its own line
                indentLevel = Math.max(0, indentLevel - 1);
                indentedLine = '  '.repeat(indentLevel) + line;
            } else if (line.match(/<[a-z0-9]+.*\/>$/i)) {
                // Self-closing tag
                indentedLine += line;
            } else if (line.match(/<[a-z0-9]+.*>/i) && !line.match(/<\/[a-z0-9]+>/i)) {
                // Opening tag without closing tag
                indentedLine += line;
                indentLevel++;
            } else {
                // Regular line
                indentedLine += line;
            }
            
            result += indentedLine + '\n';
        }
        
        return result;
    }

    // Update line numbers
    function updateLineNumbers(textarea, lineNumbersElement) {
        const lines = textarea.value.split('\n');
        const lineCount = lines.length;
        
        lineNumbersElement.innerHTML = '';
        for (let i = 1; i <= lineCount; i++) {
            const lineNumber = document.createElement('div');
            lineNumber.textContent = i;
            lineNumbersElement.appendChild(lineNumber);
        }
    }

    // Show notification
    function showNotification(message, type) {
        notification.className = 'notification ' + type + ' show';
        notificationMessage.textContent = message;
        
        // Update icon based on notification type
        const icon = notification.querySelector('.notification-icon');
        icon.className = type === 'success' ? 'notification-icon fas fa-check-circle' : 
                       type === 'error' ? 'notification-icon fas fa-exclamation-circle' : 
                       'notification-icon fas fa-info-circle';
        
        // Auto hide after 4 seconds
        clearTimeout(window.notificationTimeout);
        window.notificationTimeout = setTimeout(() => {
            notification.className = 'notification';
        }, 4000);
    }

    // Close notification
    function closeNotification() {
        notification.className = 'notification';
        clearTimeout(window.notificationTimeout);
    }

    // Toggle theme
    function toggleTheme() {
        const body = document.body;
        const isDarkTheme = !body.classList.contains('light-theme');
        
        if (isDarkTheme) {
            body.classList.add('light-theme');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.remove('light-theme');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', 'dark');
        }
    }

    // Load saved theme preference
    function loadThemePreference() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
});
