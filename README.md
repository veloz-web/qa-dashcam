# 🎥 QA Dashcam

**Keep it 100** - Your browser interactions, recorded and ready for QA.

## Overview

QA Dashcam is a Chrome extension that acts like a dashcam for your web interactions. It silently records user clicks and keyboard inputs, maintaining a rolling log of the last 100 events to help with QA testing, debugging, and user behavior analysis.

## Features

- 🖱️ **Click Tracking** - Records all click events with precise CSS selectors and mouse coordinates
- ⌨️ **Keyboard Input Logging** - Captures keystrokes in input fields and textareas with modifier keys
- 🛣️ **Navigation Tracking** - Monitors URL changes and route transitions (including SPAs)
- 📝 **Form Submissions** - Logs form data with automatic sensitive field masking
- 🎯 **Focus Events** - Tracks element focus changes for UX analysis
- 📜 **Scroll Tracking** - Records significant scroll events (throttled)
- 🎯 **Smart Selectors** - Prioritizes data attributes, unique IDs, and minimal CSS paths
- 💾 **Rolling Storage** - Keeps the last 100 events to prevent storage bloat
- 🕒 **Enhanced Context** - Captures viewport size, mouse position, element details, and page context
- 📊 **Session Management** - Groups events by browsing sessions with duration tracking
- 📤 **Export Options** - JSON, CSV, and automated Cypress test generation
- 🗑️ **Easy Management** - Clear logs and session data with one click

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The QA Dashcam icon will appear in your extensions toolbar

## Usage

1. **Start Recording**: The extension automatically starts recording once installed
2. **View Events**: Click the QA Dashcam icon to open the event log popup
3. **Session Tracking**: Each browser session is tracked with unique IDs and duration
4. **Export Data**: Use the export buttons to save logs as JSON or CSV
5. **Generate Tests**: Create Cypress test scripts from recorded user interactions
6. **Clear Data**: Use the clear button to reset all logged events and sessions

## Export Options

### 📄 JSON Export
- Complete event data with all context information
- Metadata including export timestamp and version
- Perfect for detailed analysis or custom processing

### 📊 CSV Export
- Simplified tabular format for spreadsheet analysis
- Key fields: timestamp, type, selector, element text, URL
- Great for reporting and data visualization

### 🧪 Cypress Test Generation
- Automatically generates Cypress test scripts from recorded interactions
- Groups events by page/URL for organized test structure
- Includes clicks, form inputs, and navigation
- Ready-to-use test cases for regression testing

## Event Types

### Click Events
```json
{
  "type": "click",
  "selector": "button.submit-btn",
  "element": {
    "tagName": "button",
    "text": "Submit Form",
    "position": { "x": 150, "y": 200, "width": 120, "height": 40 }
  },
  "mouse": {
    "x": 150, "y": 200, "button": 0,
    "ctrlKey": false, "shiftKey": false
  },
  "context": {
    "viewport": { "width": 1920, "height": 1080 },
    "page": { "title": "Contact Form", "url": "https://example.com/contact" }
  },
  "sessionId": "session_1234567890_abc123",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Keyboard Events
```json
{
  "type": "keypress",
  "key": "Enter",
  "selector": "input#email",
  "element": {
    "value": "user@example.com",
    "placeholder": "Enter your email"
  },
  "modifiers": {
    "ctrlKey": false, "shiftKey": false, "altKey": false
  },
  "sessionId": "session_1234567890_abc123",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Navigation Events
```json
{
  "type": "navigation",
  "from": "https://example.com/page1",
  "to": "https://example.com/page2",
  "context": {
    "page": { "title": "New Page", "url": "https://example.com/page2" }
  },
  "sessionId": "session_1234567890_abc123",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Form Submission Events
```json
{
  "type": "form_submit",
  "selector": "form#contact-form",
  "formData": {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "[MASKED]"
  },
  "sessionId": "session_1234567890_abc123",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

## File Structure

```
qa-dashcam/
├── manifest.json          # Extension configuration
├── content.js            # Enhanced event capture with context
├── service-worker.js     # Background processing & session management
├── popup.html           # Enhanced UI with export controls
├── popup.js             # Event display & export functionality
└── README.md           # This file
```

## Privacy & Security

- Events are stored locally in your browser only
- No data is transmitted to external servers
- Sensitive input values are captured - use responsibly
- Consider privacy implications when testing on production sites

## Development Roadmap

### Proposed Enhancements

#### 🛣️ Route Tracking
- Monitor URL changes and navigation events
- Log single-page app route transitions
- Track time spent on each page/route

#### 📊 Enhanced Analytics
- Session recording with playback capability
- Mouse movement and scroll tracking
- Form completion analysis
- Page load performance metrics

#### 🎛️ Configuration Options
- Adjustable log size (currently fixed at 100)
- Event filtering (enable/disable specific event types)
- Custom selector generation rules
- Export logs to JSON/CSV

#### 🔄 Advanced Features
- Screenshot capture on specific events
- Integration with popular testing frameworks
- Automated test case generation from recorded interactions
- Error boundary detection and logging

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - See LICENSE file for details

---

**Remember: Keep it 100!** 🎯

*QA Dashcam helps you maintain quality by keeping the last 100 interactions at your fingertips.*
