document.addEventListener('DOMContentLoaded', () => {
  const logContainer = document.getElementById('log-container');

  // Retrieve the log from storage
  chrome.storage.local.get({ eventLog: [] }, (result) => {
    const log = result.eventLog;
    
    // If the log is empty, show a message
    if (log.length === 0) {
      logContainer.innerHTML = '<li>No events recorded yet.</li>';
      return;
    }

    // Display each log entry, newest first
    log.reverse().forEach(entry => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="type">${entry.type}</span> on 
        <span class="selector">${entry.selector}</span>
        ${entry.key ? `(key: ${entry.key})` : ''}
      `;
      logContainer.appendChild(li);
    });
  });
});
