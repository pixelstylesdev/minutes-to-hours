const toggleEnabled = enabled => {
	const query = {
		active: true,
		currentWindow: true
  };
  
  const msg = {
    action: 'TOGGLE_ENABLED',
    enabled
  };

	chrome.tabs.query(query, tabs => {
		if (tabs && tabs.length) {
			chrome.tabs.sendMessage(tabs[0].id, msg);
		}
	});
};

document.addEventListener('DOMContentLoaded', () => {
  const checkbox = document.querySelector('input');

  // set default value of toggle switch
  chrome.storage.local.get('enabled', store => {
    checkbox.checked = store.enabled;
  });

  checkbox.onchange = function onChange(e) {
    toggleEnabled(e.target.checked);
    chrome.storage.local.set({ 'enabled': e.target.checked });
  };
});