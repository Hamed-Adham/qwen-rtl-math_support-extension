// Qwen Chat RTL Support Extension v7
// Inspired by github.com/miladniroee/chatgpt-math-dir-resolver
// Fixes math direction issues for RTL languages

(function () {
  'use strict';

  console.log('🔄 Qwen RTL Extension v7: Starting...');

  // State
  let isRTLEnabled = true;
  let rtlButton = null;

  function saveState() {
    localStorage.setItem('qwen-rtl-enabled', isRTLEnabled ? 'true' : 'false');
  }

  function loadState() {
    const saved = localStorage.getItem('qwen-rtl-enabled');
    if (saved !== null) {
      isRTLEnabled = saved === 'true';
    }
  }

  // ============ MATH DIRECTION FIX ============
  // Based on: github.com/miladniroee/chatgpt-math-dir-resolver

  function fixMathDirection() {
    // KaTeX elements - force LTR
    const katexElements = document.querySelectorAll('.katex, .katex-html, .katex-display');
    katexElements.forEach(el => {
      el.setAttribute('dir', 'ltr');
      el.style.direction = 'ltr';
      el.style.unicodeBidi = 'isolate';
      el.style.textAlign = 'left';
    });

    // MathJax elements - force LTR
    const mathjaxElements = document.querySelectorAll('.MathJax, .mjx-container, mjx-container, .MathJax_Display');
    mathjaxElements.forEach(el => {
      el.setAttribute('dir', 'ltr');
      el.style.direction = 'ltr';
      el.style.unicodeBidi = 'isolate';
    });

    // Inline code elements - force LTR
    const codeElements = document.querySelectorAll('code:not(pre code), .qwen-markdown-code-inline');
    codeElements.forEach(el => {
      el.setAttribute('dir', 'ltr');
      el.style.direction = 'ltr';
      el.style.unicodeBidi = 'isolate';
    });
  }

  // ============ RTL TEXT HANDLING ============

  const RTL_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/;

  const CONTENT_SELECTORS = [
    '.qwen-markdown',
    '.qwen-markdown-loose',
    '.qwen-markdown-paragraph',
    '.custom-qwen-markdown',
    '.response-message-content',
    '.chat-response-message',
    '.chat-response-message-right',
    '.qwen-chat-message',
    '.qwen-chat-message-assistant',
    '.qwen-chat-message-user',
    '.phase-answer',
    '.t2t'
  ];

  const SKIP_SELECTORS = [
    '.chat-input',
    '#chat-input',
    '.chat-input-container',
    '.prompt-input-input-area',
    'pre', 'code',
    '.katex', '.katex-html',
    '.MathJax', '.mjx-container'
  ];

  function containsRTL(text) {
    return text && RTL_REGEX.test(text);
  }

  function shouldSkip(element) {
    if (!element) return true;

    const tagName = element.tagName?.toLowerCase();
    if (tagName === 'code' || tagName === 'pre') return true;

    for (const sel of SKIP_SELECTORS) {
      try {
        if (element.matches?.(sel)) return true;
        if (element.closest?.(sel)) return true;
      } catch (e) { }
    }

    return false;
  }

  function applyRTLToContent() {
    if (!isRTLEnabled) return;

    CONTENT_SELECTORS.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(element => {
          if (shouldSkip(element)) return;

          const text = element.textContent || '';
          if (containsRTL(text)) {
            element.setAttribute('dir', 'rtl');
            element.style.direction = 'rtl';
            element.style.textAlign = 'right';
            // Use 'normal' to allow child elements to have their own direction
            element.style.unicodeBidi = 'normal';
          }
        });
      } catch (e) { }
    });

    // Always fix math direction after applying RTL
    fixMathDirection();
  }

  function removeRTLFromContent() {
    CONTENT_SELECTORS.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(element => {
          element.removeAttribute('dir');
          element.style.removeProperty('direction');
          element.style.removeProperty('text-align');
          element.style.removeProperty('unicode-bidi');
        });
      } catch (e) { }
    });
  }

  function processContent() {
    if (isRTLEnabled) {
      applyRTLToContent();
    } else {
      removeRTLFromContent();
    }
  }

  // ============ RTL TOGGLE BUTTON ============

  const RTL_ICON_SVG = `
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M10 4v1h2v15h2V5h2v15h2V5h2V4H10z"/>
      <path d="M8 7l-4 4 4 4v-3h4v-2H8V7z"/>
    </svg>
  `;

  const LTR_ICON_SVG = `
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M10 4v1h2v15h2V5h2v15h2V5h2V4H10z"/>
      <path d="M4 15l4-4-4-4v3H0v2h4v3z"/>
    </svg>
  `;

  function createRTLButton() {
    const button = document.createElement('div');
    button.className = 'rtl-toggle-button';
    button.setAttribute('title', isRTLEnabled ? 'RTL فعال - کلیک برای تغییر' : 'LTR فعال - کلیک برای تغییر');

    const iconSpan = document.createElement('span');
    iconSpan.setAttribute('role', 'img');
    iconSpan.className = 'anticon';
    iconSpan.innerHTML = isRTLEnabled ? RTL_ICON_SVG : LTR_ICON_SVG;

    button.appendChild(iconSpan);

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleRTL();
    });

    return button;
  }

  function toggleRTL() {
    isRTLEnabled = !isRTLEnabled;
    saveState();
    updateButtonState();
    processContent();

    document.body.classList.toggle('qwen-rtl-enabled', isRTLEnabled);
    document.body.classList.toggle('qwen-rtl-disabled', !isRTLEnabled);

    console.log(`🔄 Qwen RTL: Switched to ${isRTLEnabled ? 'RTL' : 'LTR'}`);
  }

  function updateButtonState() {
    if (rtlButton) {
      const iconSpan = rtlButton.querySelector('.anticon');
      if (iconSpan) {
        iconSpan.innerHTML = isRTLEnabled ? RTL_ICON_SVG : LTR_ICON_SVG;
      }
      rtlButton.setAttribute('title', isRTLEnabled ? 'RTL فعال - کلیک برای تغییر' : 'LTR فعال - کلیک برای تغییر');
      rtlButton.classList.toggle('active', isRTLEnabled);
    }
  }

  function injectButton() {
    if (rtlButton && document.contains(rtlButton)) return;

    const thinkingButton = document.querySelector('.thinking-button');

    if (thinkingButton?.parentNode) {
      rtlButton = createRTLButton();
      thinkingButton.parentNode.insertBefore(rtlButton, thinkingButton);

      if (isRTLEnabled) {
        rtlButton.classList.add('active');
      }

      console.log('✅ Qwen RTL: Button injected');
    }
  }

  // ============ OBSERVER ============

  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    let shouldCheckButton = false;

    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for thinking button
            if (node.querySelector?.('.thinking-button') || node.classList?.contains('thinking-button')) {
              shouldCheckButton = true;
            }

            // Check for content elements
            if (CONTENT_SELECTORS.some(sel => node.matches?.(sel) || node.querySelector?.(sel))) {
              shouldProcess = true;
            }

            // Check for math elements
            if (node.querySelector?.('.katex') || node.querySelector?.('.MathJax')) {
              shouldProcess = true;
            }
          }
        }
      }
    }

    if (shouldCheckButton) {
      setTimeout(injectButton, 50);
    }

    if (shouldProcess) {
      setTimeout(processContent, 50);
    }
  });

  // ============ INIT ============

  function init() {
    console.log('🔄 Qwen RTL Extension v7: Initializing...');

    loadState();

    document.body.classList.toggle('qwen-rtl-enabled', isRTLEnabled);
    document.body.classList.toggle('qwen-rtl-disabled', !isRTLEnabled);

    processContent();
    injectButton();

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Periodic check (less frequent)
    setInterval(() => {
      injectButton();
      if (isRTLEnabled) {
        fixMathDirection(); // Always keep math LTR
      }
    }, 2000);

    console.log('✅ Qwen RTL Extension v7: Ready!');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      injectButton();
      processContent();
    }, 500);
  });

})();
