// State variable
let shortcutsDisabled = false;

// Get the current domain
function getCurrentDomain() {
  return window.location.hostname;
}

// Check if shortcuts should be disabled for this domain
async function checkStatus() {
  try {
    const response = await browser.runtime.sendMessage({ action: 'checkStatus' });
    shortcutsDisabled = response.disabled;
  } catch (e) {
    console.error('Error checking shortcut status:', e);
  }
}

// Block keyboard events if shortcuts are disabled
function handleKeyEvent(event) {
  if (shortcutsDisabled) {
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
}

// Install event listeners
function installListeners() {
  // Capture phase to intercept before website handlers
  document.addEventListener('keydown', handleKeyEvent, true);
  document.addEventListener('keyup', handleKeyEvent, true);
  document.addEventListener('keypress', handleKeyEvent, true);
}

// Listen for state updates from background script
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'updateState') {
    checkStatus();
  }
});

// Initialize
checkStatus().then(() => {
  installListeners();
});
