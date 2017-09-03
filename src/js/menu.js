var root = chrome.contextMenus.create({
	"title":"New Translation",
    "contexts":["selection"],
    "type":"normal",
    "id":"ue-new",
});
var rerun = chrome.contextMenus.create({
    "title":"Retranslate",
    "contexts":["page"],
    "type":"normal",
	"id":"ue-bofa",
});


chrome.contextMenus.onClicked.addListener(function(info,tab) {
	chrome.tabs.sendMessage(tab.id,{info:info,tab:tab});
});

