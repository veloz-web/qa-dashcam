document.addEventListener('DOMContentLoaded', () => {
  const logContainer = document.getElementById('log-container');
  const clearBtn = document.getElementById('clearBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const generateTestBtn = document.getElementById('generateTestBtn');
  const sessionInfo = document.getElementById('sessionInfo');
  const sessionId = document.getElementById('sessionId');
  const sessionStart = document.getElementById('sessionStart');
  const sessionDuration = document.getElementById('sessionDuration');

  // Helper function to show toast notifications
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  // Helper function to download data as file
  function downloadFile(data, filename, type) {
    const blob = new Blob([data], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Helper function to format timestamp
  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + '.' + String(date.getMilliseconds()).padStart(3, '0');
  }

  // Helper function to format duration
  function formatDuration(startTime) {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    } else if (diffMins > 0) {
      return `${diffMins}m`;
    } else {
      return '<1m';
    }
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
      'scroll_start': '📜',
      'navigation': '🛣️',
      'page_load': '📄'
    };
    return icons[type] || '📋';
  }

  // Helper function to get event color
  function getEventColor(type) {
    const colors = {
      'click': '#4CAF50',
      'keypress': '#2196F3',
      'form_submit': '#FF9800',
      'focus': '9C27B0',
      'scroll': '#607D8B',
      'scroll_start': '#90A4AE',
      'navigation': '#F44336',
      'page_load': '#795548'
    };
    return colors[type] || '#666';
  }

  // Export functions
  function exportAsJson(log) {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalEvents: log.length,
      events: log,
      metadata: {
        version: '1.0',
        source: 'QA DashCam Chrome Extension'
      }
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadFile(jsonString, `qa-dashcam-${timestamp}.json`, 'application/json');
    showToast('Events exported as JSON');
  }

  function exportAsCsv(log) {
    const headers = [
      'Timestamp',
      'Type', 
      'Selector',
      'Element Text',
      'Page Title',
      'URL',
      'Mouse X',
      'Mouse Y',
      'Key',
      'Scroll Direction',
      'Scroll Distance',
      'Scroll Velocity',
      'Scroll Duration',
      'Session ID'
    ];
    
    const rows = log.map(event => [
      event.timestamp,
      event.type,
      event.selector || '',
      event.element?.text || '',
      event.context?.page?.title || '',
      event.context?.page?.url || '',
      event.mouse?.x || '',
      event.mouse?.y || '',
      event.key || '',
      event.scroll?.direction || '',
      event.scroll?.distance || '',
      event.scroll?.velocity || '',
      event.scroll?.duration || '',
      event.sessionId || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadFile(csvContent, `qa-dashcam-${timestamp}.csv`, 'text/csv');
    showToast('Events exported as CSV');
  }

  function generateTestScript(log) {
    const clickEvents = log.filter(e => e.type === 'click');
    const inputEvents = log.filter(e => e.type === 'keypress');
    
    let testScript = `// QA DashCam Generated Test Script
// Generated on: ${new Date().toISOString()}
// Total events: ${log.length}

describe('User Journey Test', () => {
  beforeEach(() => {
    cy.visit('${log[0]?.context?.page?.url || 'YOUR_URL_HERE'}');
  });

  it('should reproduce user interactions', () => {
`;

    // Group events by page
    const eventsByPage = {};
    log.forEach(event => {
      const url = event.context?.page?.url || 'unknown';
      if (!eventsByPage[url]) eventsByPage[url] = [];
      eventsByPage[url].push(event);
    });

    Object.entries(eventsByPage).forEach(([url, events]) => {
      if (url !== 'unknown' && events.length > 0) {
        testScript += `    // Events on: ${url}\n`;
        
        events.forEach(event => {
          switch (event.type) {
            case 'click':
              testScript += `    cy.get('${event.selector}').click();\n`;
              break;
            case 'keypress':
              if (event.element?.value) {
                testScript += `    cy.get('${event.selector}').type('${event.element.value}');\n`;
              }
              break;
            case 'form_submit':
              testScript += `    cy.get('${event.selector}').submit();\n`;
              break;
          }
        });
        testScript += `\n`;
      }
    });

    testScript += `  });
});`;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadFile(testScript, `qa-dashcam-test-${timestamp}.cy.js`, 'text/javascript');
    showToast('Cypress test script generated');
  }

  // Clear logs function
  function clearLogs() {
    if (confirm('Are you sure you want to clear all logged events? This cannot be undone.')) {
      chrome.storage.local.set({ 
        eventLog: [],
        sessionStats: {}
      }, () => {
        logContainer.innerHTML = '<li style="text-align: center; color: #666; padding: 20px;">All events cleared.<br><small>Start interacting with web pages to see new events.</small></li>';
        sessionInfo.style.display = 'none';
        showToast('All events cleared', 'success');
      });
    }
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
      const direction = entry.scroll.direction || 'none';
      const distance = entry.scroll.distance || 0;
      const velocity = entry.scroll.velocity || 0;
      const duration = entry.scroll.duration || 0;
      
      let scrollDetails = `${direction.toUpperCase()}`;
      if (distance > 0) scrollDetails += ` ${distance}px`;
      if (velocity > 0) scrollDetails += ` @${velocity}px/s`;
      if (duration > 0) scrollDetails += ` (${Math.round(duration)}ms)`;
      
      content += `<div class="details">Scroll: ${scrollDetails}</div>`;
      if (entry.scroll.deltaX !== 0 || entry.scroll.deltaY !== 0) {
        content += `<div class="details">Delta: (${entry.scroll.deltaX}, ${entry.scroll.deltaY})</div>`;
      }
    }

    if (entry.type === 'scroll_start') {
      content += `<div class="details">Scroll started at (${entry.scroll.x}, ${entry.scroll.y})</div>`;
    }

    if (entry.type === 'navigation') {
      content += `<div class="details">From: ${entry.from}<br>To: ${entry.to}</div>`;
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

  // Event listeners
  clearBtn.addEventListener('click', clearLogs);
  exportJsonBtn.addEventListener('click', () => {
    chrome.storage.local.get({ eventLog: [] }, (result) => {
      exportAsJson(result.eventLog);
    });
  });
  
  exportCsvBtn.addEventListener('click', () => {
    chrome.storage.local.get({ eventLog: [] }, (result) => {
      exportAsCsv(result.eventLog);
    });
  });
  
  generateTestBtn.addEventListener('click', () => {
    chrome.storage.local.get({ eventLog: [] }, (result) => {
      generateTestScript(result.eventLog);
    });
  });

  // Load and display data
  chrome.storage.local.get({ 
    eventLog: [], 
    sessionStats: {},
    currentSession: null,
    sessionStartTime: null
  }, (result) => {
    const log = result.eventLog;
    const sessionStats = result.sessionStats || {};
    const currentSessionId = result.currentSession;
    const sessionStartTime = result.sessionStartTime;
    
    // Display session info
    if (currentSessionId && sessionStartTime) {
      sessionInfo.style.display = 'block';
      sessionId.textContent = currentSessionId.substring(8, 20) + '...'; // Show partial ID
      sessionStart.textContent = new Date(sessionStartTime).toLocaleTimeString();
      sessionDuration.textContent = formatDuration(sessionStartTime);
    }
    
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
    
    // Calculate event type distribution
    const eventTypes = {};
    log.forEach(event => {
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
    });
    
    const topEventTypes = Object.entries(eventTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => `${getEventIcon(type)}${count}`)
      .join(' ');

    summary.innerHTML = `
      <div style="background: #f5f5f5; padding: 12px; margin-bottom: 15px; border-radius: 5px; font-size: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            📊 <strong>${log.length}</strong> events recorded
            <span style="margin-left: 15px;">${topEventTypes}</span>
          </div>
          <div style="color: #666; font-size: 11px;">
            Last: ${formatTimestamp(log[log.length - 1].timestamp)}
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 11px; color: #666;">
          Session events: ${log.filter(e => e.sessionId === currentSessionId).length} 
          | Showing last ${Math.min(log.length, 100)} events
        </div>
      </div>
    `;
    logContainer.parentNode.insertBefore(summary, logContainer);
  });
});document.addEventListener('DOMContentLoaded', () => {
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
function getEventIconUnicode(type) {
  const icons = {
    'click': '\u{1F5B1}\u{FE0F}',      // 🖱️ mouse
    'keypress': '\u{2328}\u{FE0F}',     // ⌨️ keyboard  
    'form_submit': '\u{1F4DD}',         // 📝 memo
    'focus': '\u{1F3AF}',               // 🎯 target
    'scroll': '\u{1F4DC}',              // 📜 scroll
    'scroll_start': '\u{1F4DC}',        // 📜 scroll
    'navigation': '\u{1F6E3}\u{FE0F}',  // 🛣️ road
    'page_load': '\u{1F4C4}'            // 📄 page
  };
  return icons[type] || '\u{1F4CB}';    // 📋 clipboard as default
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
