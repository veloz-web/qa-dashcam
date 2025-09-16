// Function to generate a unique CSS selector for an element
function getSelector(element) {
  if (!element) return '';
  if (element.id) return `#${element.id}`;
  
  let path = '', node = element;
  while (node.nodeType === Node.ELEMENT_NODE) {
    let selector = node.nodeName.toLowerCase();
    if (node.className) {
      selector += '.' + node.className.trim().replace(/\s+/g, '.');
    }
    // Prepend the new selector part
    path = selector + (path ? ' > ' + path : '');
    node = node.parentNode;
  }
  return path;
}

// Listen for all clicks on the page
document.addEventListener('click', (event) => {
  const logEntry = {
    type: 'click',
    selector: getSelector(event.target),
    timestamp: new Date().toISOString()
  };
  // Send the captured data to the service worker
  chrome.runtime.sendMessage(logEntry);
}, true); // Use capturing phase to get the event early

// Listen for keyboard input
document.addEventListener('keydown', (event) => {
  // We only care about inputs, textareas, etc.
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    const logEntry = {
      type: 'keypress',
      key: event.key,
      selector: getSelector(event.target),
      value: event.target.value, // Capture the value at the time of the keypress
      timestamp: new Date().toISOString()
    };
    chrome.runtime.sendMessage(logEntry);
  }
}, true);
