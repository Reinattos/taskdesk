const TI_MANAGER_URL = 'http://127.0.0.1:5173/';

chrome.action.onClicked.addListener(async () => {
  const tabs = await chrome.tabs.query({ url: TI_MANAGER_URL });
  const existingTab = tabs[0];

  if (existingTab?.id) {
    await chrome.tabs.update(existingTab.id, { active: true });
    if (existingTab.windowId) {
      await chrome.windows.update(existingTab.windowId, { focused: true });
    }
    return;
  }

  await chrome.tabs.create({ url: TI_MANAGER_URL });
});
