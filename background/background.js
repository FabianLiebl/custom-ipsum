chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: 'customIpsumContextMenuFill',
        title: 'Fill with Custom Ipsum',
        type: 'normal',
        contexts: ['editable'],
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    chrome.tabs.sendMessage(tab.id, {
        messageType: "custom-ipsum-get-clicked-element-type",
        payload: null
    }, {frameId: info.frameId}, (data) => {
        if (data.value === 'input') {
            chrome.tabs.sendMessage(tab.id, {
                messageType: "custom-ipsum-fill",
                payload: 'Blubb'
            }, { frameId: info.frameId });
        }
    });
});
