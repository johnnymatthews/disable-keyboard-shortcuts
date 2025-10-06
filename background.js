// Helper function to extract domain from URL
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
}

// Helper function to check if shortcuts are disabled for a domain
async function isDisabled(domain) {
  const result = await browser.storage.local.get('disabledDomains');
  const disabledDomains = result.disabledDomains || [];
  return disabledDomains.includes(domain);
}

// Update icon based on whether shortcuts are disabled
async function updateIcon(tabId, domain) {
  const disabled = await isDisabled(domain);
  
  const iconPath = disabled ? {
    "16": "icons/disabled-16.png",
    "32": "icons/disabled-32.png",
    "48": "icons/disabled-48.png"
  } : {
    "16": "icons/enabled-16.png",
    "32": "icons/enabled-32.png",
    "48": "icons/enabled-48.png"
  };
  
  const title = disabled ? 
    "Keyboard shortcuts disabled (click to enable)" : 
    "Keyboard shortcuts enabled (click to disable)";
  
  browser.browserAction.setIcon({ tabId, path: iconPath });
  browser.browserAction.setTitle({ tabId, title });
}

// Handle toolbar icon click
browser.browserAction.onClicked.addListener(async (tab) => {
  const domain = getDomain(tab.url);
  if (!domain) return;
  
  const result = await browser.storage.local.get('disabledDomains');
  let disabledDomains = result.disabledDomains || [];
  
  // Toggle the domain
  if (disabledDomains.includes(domain)) {
    disabledDomains = disabledDomains.filter(d => d !== domain);
  } else {
    disabledDomains.push(domain);
  }
  
  await browser.storage.local.set({ disabledDomains });
  
  // Update icon
  await updateIcon(tab.id, domain);
  
  // Notify content script to update its state
  browser.tabs.sendMessage(tab.id, { action: 'updateState' }).catch(() => {
    // Ignore errors if content script isn't ready
  });
});

// Update icon when tab is activated or updated
browser.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await browser.tabs.get(activeInfo.tabId);
  const domain = getDomain(tab.url);
  if (domain) {
    await updateIcon(tab.id, domain);
  }
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    const domain = getDomain(tab.url);
    if (domain) {
      await updateIcon(tabId, domain);
    }
  }
});

// Handle messages from content script
browser.runtime.onMessage.addListener(async (message, sender) => {
  if (message.action === 'checkStatus') {
    const domain = getDomain(sender.tab.url);
    const disabled = await isDisabled(domain);
    return { disabled };
  }
});
