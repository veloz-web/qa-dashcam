const MAX_LOG_SIZE = 100; // Keep only the last 100 events

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Get the current log from storage
  chrome.storage.local.get({ eventLog: [] }, (result) => {
    let log = result.eventLog;
    
    // Add the new message to the log
    log.push(message);
    
    // If the log is too big, trim the oldest entries
    if (log.length > MAX_LOG_SIZE) {
      log = log.slice(log.length - MAX_LOG_SIZE);
    }
    
    // Save the updated log back to storage
    chrome.storage.local.set({ eventLog: log });
  });

  // Return true to indicate you will send a response asynchronously (optional)
  return true;
});
