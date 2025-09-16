// Enhanced function to generate a more efficient and readable CSS selector
function getSelector(element) {
  if (!element) return '';
  
  // Priority 1: Use ID if available and unique
  if (element.id && document.querySelectorAll(`#${element.id}`).length === 1) {
    return `#${element.id}`;
  }
  
  // Priority 2: Use data attributes (common in modern apps)
  const dataTestId = element.getAttribute('data-testid') || element.getAttribute('data-test-id');
  if (dataTestId) {
    return `[data-testid="${dataTestId}"]`;
  }
  
  const dataId = element.getAttribute('data-id');
  if (dataId) {
    return `[data-id="${dataId}"]`;
  }
  
  // Priority 3: Use unique class combinations
  if (element.className) {
    const classes = element.className.trim().split(/\s+/).filter(c => c.length > 0);
    if (classes.length > 0) {
      const classSelector = '.' + classes.join('.');
      const elementsWithClasses = document.querySelectorAll(element.tagName.toLowerCase() + classSelector);
      if (elementsWithClasses.length === 1) {
        return element.tagName.toLowerCase() + classSelector;
      }
    }
  }
  
  // Priority 4: Build minimal path with smart shortcuts
  const path = [];
  let current = element;
  
  while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
    let selector = current.nodeName.toLowerCase();
    
    // Add classes if they help with uniqueness
    if (current.className) {
      const classes = current.className.trim().split(/\s+/)
        .filter(c => c.length > 0 && !c.match(/^(active|hover|focus|selected)$/i)) // Skip state classes
        .slice(0, 2); // Limit to 2 most relevant classes
      
      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }
    
    // Use nth-child if needed for uniqueness
    const siblings = Array.from(current.parentNode?.children || [])
      .filter(child => child.nodeName === current.nodeName);
    
    if (siblings.length > 1) {
      const index = siblings.indexOf(current) + 1;
      selector += `:nth-child(${index})`;
    }
    
    path.unshift(selector);
    
    // Stop if we have a unique selector
    if (document.querySelectorAll(path.join(' > ')).length === 1) {
      break;
    }
    
    current = current.parentNode;
    
    // Safety: don't go too deep
    if (path.length > 5) break;
  }
  
  return path.join(' > ');
}

// Function to get enhanced context information
function getEventContext() {
  return {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    scroll: {
      x: window.scrollX,
      y: window.scrollY
    },
    page: {
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname
    },
    activeElement: document.activeElement ? {
      tagName: document.activeElement.tagName.toLowerCase(),
      selector: getSelector(document.activeElement)
    } : null
  };
}

// Function to get element context
function getElementContext(element) {
  const rect = element.getBoundingClientRect();
  return {
    tagName: element.tagName.toLowerCase(),
    text: element.textContent?.trim().substring(0, 100) || null, // First 100 chars
    value: element.value || null,
    placeholder: element.placeholder || null,
    type: element.type || null,
    position: {
      x: Math.round(rect.left + window.scrollX),
      y: Math.round(rect.top + window.scrollY),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    },
    visible: rect.width > 0 && rect.height > 0 && 
             rect.top < window.innerHeight && rect.bottom > 0,
    attributes: {
      id: element.id || null,
      className: element.className || null,
      name: element.name || null
    }
  };
}

// Enhanced click event listener
document.addEventListener('click', (event) => {
  const context = getEventContext();
  const elementContext = getElementContext(event.target);
  
  const logEntry = {
    type: 'click',
    selector: getSelector(event.target),
    element: elementContext,
    mouse: {
      x: event.clientX,
      y: event.clientY,
      button: event.button, // 0=left, 1=middle, 2=right
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey
    },
    context: context,
    timestamp: new Date().toISOString()
  };
  
  // Send the captured data to the service worker
  chrome.runtime.sendMessage(logEntry);
}, true);

// Enhanced keyboard input listener
document.addEventListener('keydown', (event) => {
  // Focus on input elements
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || 
      event.target.contentEditable === 'true') {
    
    const context = getEventContext();
    const elementContext = getElementContext(event.target);
    
    const logEntry = {
      type: 'keypress',
      key: event.key,
      code: event.code,
      keyCode: event.keyCode,
      selector: getSelector(event.target),
      element: elementContext,
      modifiers: {
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey
      },
      context: context,
      timestamp: new Date().toISOString()
    };
    
    chrome.runtime.sendMessage(logEntry);
  }
}, true);

// Track form submissions
document.addEventListener('submit', (event) => {
  const context = getEventContext();
  const form = event.target;
  
  // Collect form data (be careful with sensitive data)
  const formData = new FormData(form);
  const fields = {};
  
  for (let [key, value] of formData.entries()) {
    // Mask potentially sensitive fields
    if (key.toLowerCase().includes('password') || 
        key.toLowerCase().includes('ssn') || 
        key.toLowerCase().includes('credit')) {
      fields[key] = '[MASKED]';
    } else {
      fields[key] = typeof value === 'string' ? value.substring(0, 100) : '[FILE]';
    }
  }
  
  const logEntry = {
    type: 'form_submit',
    selector: getSelector(form),
    element: getElementContext(form),
    formData: fields,
    context: context,
    timestamp: new Date().toISOString()
  };
  
  chrome.runtime.sendMessage(logEntry);
}, true);

// Track focus changes for better UX understanding
let lastFocusedElement = null;
document.addEventListener('focusin', (event) => {
  if (lastFocusedElement !== event.target) {
    const context = getEventContext();
    const elementContext = getElementContext(event.target);
    
    const logEntry = {
      type: 'focus',
      selector: getSelector(event.target),
      element: elementContext,
      context: context,
      timestamp: new Date().toISOString()
    };
    
    chrome.runtime.sendMessage(logEntry);
    lastFocusedElement = event.target;
  }
}, true);

// Track significant scroll events (throttled)
let scrollTimeout = null;
document.addEventListener('scroll', () => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  
  scrollTimeout = setTimeout(() => {
    const context = getEventContext();
    
    const logEntry = {
      type: 'scroll',
      scroll: context.scroll,
      viewport: context.viewport,
      context: context,
      timestamp: new Date().toISOString()
    };
    
    chrome.runtime.sendMessage(logEntry);
  }, 500); // Only log scroll events every 500ms
}, true);
