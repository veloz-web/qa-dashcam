const MAX_LOG_SIZE = 100; // Keep only the last 100 events

// Generate a unique session ID
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get or create current session
async function getCurrentSession() {
  const result = await chrome.storage.local.get(['currentSession', 'sessionStartTime']);
  
  if (!result.currentSession) {
    const sessionId = generateSessionId();
    const startTime = new Date().toISOString();
    
    await chrome.storage.local.set({
      currentSession: sessionId,
      sessionStartTime: startTime
    });
    
    return {
      sessionId: sessionId,
      startTime: startTime
    };
  }
  
  return {
    sessionId: result.currentSession,
    startTime: result.sessionStartTime
  };
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  try {
    // Get current session info
    const session = await getCurrentSession();
    
    // Add session info to the message
    const enrichedMessage = {
      ...message,
      sessionId: session.sessionId,
      sessionStartTime: session.startTime
    };
    
    // Get the current log from storage
    const result = await chrome.storage.local.get({ 
      eventLog: [],
      sessionStats: {}
    });
    
    let log = result.eventLog;
    let sessionStats = result.sessionStats || {};
    
    // Add the new message to the log
    log.push(enrichedMessage);
    
    // Update session statistics
    if (!sessionStats[session.sessionId]) {
      sessionStats[session.sessionId] = {
        startTime: session.startTime,
        eventCount: 0,
        eventTypes: {},
        lastActivity: message.timestamp
      };
    }
    
    const currentSessionStats = sessionStats[session.sessionId];
    currentSessionStats.eventCount++;
    currentSessionStats.lastActivity = message.timestamp;
    currentSessionStats.eventTypes[message.type] = (currentSessionStats.eventTypes[message.type] || 0) + 1;
    
    // If the log is too big, trim the oldest entries
    if (log.length > MAX_LOG_SIZE) {
      log = log.slice(log.length - MAX_LOG_SIZE);
    }
    
    // Save the updated log and stats back to storage
    await chrome.storage.local.set({ 
      eventLog: log,
      sessionStats: sessionStats
    });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error processing message:', error);
    sendResponse({ success: false, error: error.message });
  }
  
  return true; // Keep the message channel open for async response
});

// Handle extension startup (new session detection)
chrome.runtime.onStartup.addListener(async () => {
  // Create a new session on browser startup
  const sessionId = generateSessionId();
  const startTime = new Date().toISOString();
  
  await chrome.storage.local.set({
    currentSession: sessionId,
    sessionStartTime: startTime
  });
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Initialize storage on first install
    const sessionId = generateSessionId();
    const startTime = new Date().toISOString();
    
    await chrome.storage.local.set({
      eventLog: [],
      sessionStats: {},
      currentSession: sessionId,
      sessionStartTime: startTime
    });
  }
});

// Clean up old session data (keep only last 5 sessions)
async function cleanupOldSessions() {
  const result = await chrome.storage.local.get(['sessionStats']);
  const sessionStats = result.sessionStats || {};
  
  const sessions = Object.entries(sessionStats)
    .map(([id, stats]) => ({ id, ...stats }))
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  
  if (sessions.length > 5) {
    const sessionsToKeep = sessions.slice(0, 5);
    const newSessionStats = {};
    
    sessionsToKeep.forEach(session => {
      newSessionStats[session.id] = {
        startTime: session.startTime,
        eventCount: session.eventCount,
        eventTypes: session.eventTypes,
        lastActivity: session.lastActivity
      };
    });
    
    await chrome.storage.local.set({ sessionStats: newSessionStats });
  }
}

// Run cleanup every hour
setInterval(cleanupOldSessions, 60 * 60 * 1000);
