document.addEventListener('DOMContentLoaded', function() {
    syncEnable();
	bindSwitchClick();
    bindEnableChange();
});

function syncEnable() {
	chrome.storage.sync.get(['enabled'], (result) => {
		document.getElementById('enabled').checked = result['enabled'];
	});
}

function bindSwitchClick() {
	document.querySelector('.switch').addEventListener('click', (e) => {
		document.getElementById('enabled').click();
	});
}

function bindEnableChange () {
	document.getElementById('enabled').addEventListener('change', (event) => { 
		chrome.storage.sync.set({'enabled': event.target.checked}, () => {
			sendMessage(event.target.checked);
		});
	});
}

function sendMessage(message) {
	chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
		chrome.tabs.sendMessage(tabs[0].id, {action: message});
	});
}
