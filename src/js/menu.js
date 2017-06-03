
var root = chrome.contextMenus.create({
	"title":"New Translation",
    "contexts":["selection"],
    "type":"normal",
    "id":"ue-new",
});

chrome.contextMenus.onClicked.addListener(function(info,tab) {
	chrome.tabs.sendMessage(tab.id,{info:info,tab:tab});
});

