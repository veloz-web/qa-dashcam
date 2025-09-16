document.addEventListener('DOMContentLoaded', () => {
  const logContainer = document.getElementById('log-container');

  // Helper function to format timestamp
  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + '.' + String(date.getMilliseconds()).padStart(3, '0');
  }

  // Helper function to format mouse position
  function formatMouse(mouse) {
    if (!mouse) return '';
    const modifiers = [];
    if (mouse.ctrlKey) modifiers.push('Ctrl');
    if (mouse.shiftKey) modifiers.push('Shift');
    if (mouse.altKey) modifiers.push('Alt');
    if (mouse.metaKey) modifiers.push('Meta');
    
    const modifierText = modifiers.length > 0 ? ` +${modifiers.join('+')}` : '';
    const buttonText = mouse.button === 2 ? ' (right)' : mouse.button === 1 ? ' (middle)' : '';
    
    return `@(${mouse.x}, ${mouse.y})${buttonText}${modifierText}`;
  }

  // Helper function to format element info
  function formatElement(element) {
    if (!element) return '';
    
    let info = [];
    
    if (element.text && element.text.length > 0) {
      info.push(`"${element.text.substring(0, 30)}${element.text.length > 30 ? '...' : ''}"`);
    }
    
    if (element.value) {
      const displayValue = element.value.length > 20 ? 
        element.value.substring(0, 20) + '...' : element.value;
      info.push(`value: "${displayValue}"`);
    }
    
    if (element.position) {
      info.push(`${element.position.width}×${element.position.height}`);
    }
    
    return info.length > 0 ? ` [${info.join(', ')}]` : '';
  }

  // Helper function to get event icon
  function getEventIcon(type) {
    const icons = {
      'click': '🖱️',
      'keypress': '⌨️',
      'form_submit': '📝',
      'focus': '🎯',
      'scroll': '📜',
      'navigation': '🛣️'
    };
    return icons[type] || '📋';
  }

  // Helper function to get event color
  function getEventColor(type) {
    const colors = {
      'click': '#4CAF50',
      'keypress': '#2196F3',
      'form_submit': '#FF9800',
      'focus': '#9C27B0',
      'scroll': '#607D8B',
      'navigation': '#F44336'
    };
    return colors[type] || '#666';
  }

  // Create detailed event entry
  function createEventEntry(entry) {
    const li = document.createElement('li');
    li.style.borderLeft = `3px solid ${getEventColor(entry.type)}`;
    li.style.paddingLeft = '12px';
    
    let content = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="flex: 1;">
          <span class="event-header">
            ${getEventIcon(entry.type)} 
            <span class="type" style="color: ${getEventColor(entry.type)}">${entry.type}</span>
          </span>
          <div class="selector-line">
            <span class="selector">${entry.selector}</span>
            ${formatElement(entry.element)}
          </div>
    `;

    // Add event-specific details
    if (entry.type === 'click' && entry.mouse) {
      content += `<div class="details">Mouse: ${formatMouse(entry.mouse)}</div>`;
    }
    
    if (entry.type === 'keypress') {
      const modifiers = [];
      if (entry.modifiers?.ctrlKey) modifiers.push('Ctrl');
      if (entry.modifiers?.shiftKey) modifiers.push('Shift');
      if (entry.modifiers?.altKey) modifiers.push('Alt');
      if (entry.modifiers?.metaKey) modifiers.push('Meta');
      
      const modifierText = modifiers.length > 0 ? `+${modifiers.join('+')} ` : '';
      content += `<div class="details">Key: ${modifierText}${entry.key}</div>`;
    }
    
    if (entry.type === 'form_submit' && entry.formData) {
      const fieldCount = Object.keys(entry.formData).length;
      content += `<div class="details">Form fields: ${fieldCount}</div>`;
    }
    
    if (entry.type === 'scroll' && entry.scroll) {
      content += `<div class="details">Scroll: (${entry.scroll.x}, ${entry.scroll.y})</div>`;
    }

    // Add context info if available
    if (entry.context?.page?.title && entry.context.page.title !== document.title) {
      content += `<div class="page-context">📄 ${entry.context.page.title}</div>`;
    }

    content += `
        </div>
        <div class="timestamp">${formatTimestamp(entry.timestamp)}</div>
      </div>
    `;

    li.innerHTML = content;
    return li;
  }

  // Retrieve the log from storage
  chrome.storage.local.get({ eventLog: [] }, (result) => {
    const log = result.eventLog;
    
    // If the log is empty, show a message
    if (log.length === 0) {
      logContainer.innerHTML = '<li style="text-align: center; color: #666; padding: 20px;">No events recorded yet.<br><small>Start interacting with web pages to see events here.</small></li>';
      return;
    }

    // Display each log entry, newest first
    log.reverse().forEach(entry => {
      const listItem = createEventEntry(entry);
      logContainer.appendChild(listItem);
    });

    // Add summary at the top
    const summary = document.createElement('div');
    summary.id = 'summary';
    summary.innerHTML = `
      <div style="background: #f5f5f5; padding: 10px; margin-bottom: 15px; border-radius: 5px; font-size: 12px;">
        📊 <strong>${log.length}</strong> events recorded 
        | Last: ${formatTimestamp(log[log.length - 1].timestamp)}
        <br>
        <small style="color: #666;">Showing last ${Math.min(log.length, 100)} events</small>
      </div>
    `;
    logContainer.parentNode.insertBefore(summary, logContainer);
  });
});
