var ipsumRecords = [];
var ipsumRecordsInput = [];
var ipsumRecordsTextarea = [];

// region Context Menu

chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        id: 'customIpsumContextMenuFill',
        title: 'Fill with Custom Ipsum',
        type: 'normal',
        contexts: ['editable'],
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    handleInsert(tab.id, info.frameId);
});

// endregion

// region Storage

chrome.storage.local.get(['ipsum-records']).then((result) => {
    console.log('Loading records from storage:');
    console.log(result);
    if (result.hasOwnProperty('ipsum-records')) {
        ipsumRecords = result['ipsum-records'];
        sortIpsumRecords();
    } else {
        ipsumRecords = [];
        ipsumRecordsInput = [];
        ipsumRecordsTextarea = [];
    }
});

// endregion

// region internal communication

chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
        if (msg.hasOwnProperty('messageType')) {
            if (msg.messageType === 'custom-ipsum-add-record') {
                ipsumRecords.push({
                    type: msg.payload.type,
                    text: msg.payload.text
                });
                sortIpsumRecords();
                chrome.storage.local.set({
                    'ipsum-records': ipsumRecords
                }).then((result) => {
                    port.postMessage({
                        messageType: 'custom-ipsum-success',
                        payload: true,
                    });
                });
            }
            if (msg.messageType === 'custom-ipsum-delete-record') {
                console.log('Deleting record at index ' + msg.payload.index);
                console.log(ipsumRecords);

                let newIpsumRecords = [];
                for(let i = 0; i < ipsumRecords.length; i++) {
                    if (i == msg.payload.index) {
                        continue;
                    }
                    newIpsumRecords.push(ipsumRecords[i]);
                }
                ipsumRecords = newIpsumRecords;
                console.log(ipsumRecords);
                sortIpsumRecords();
                chrome.storage.local.set({
                    'ipsum-records': ipsumRecords
                }).then((result) => {
                    port.postMessage({
                        messageType: 'custom-ipsum-success',
                        payload: true,
                    });
                });
            }
            if (msg.messageType === 'custom-ipsum-get-records') {
                console.log('Sending records');
                console.log(ipsumRecords);
                port.postMessage({
                    messageType: 'custom-ipsum-records',
                    payload: ipsumRecords,
                });
            }
        }
    });
});

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.hasOwnProperty('messageType')) {
        if (msg.messageType === 'custom-ipsum-request-insert') {
            handleInsert(sender.tab.id, sender.frameId);
        }
    }
});

function sortIpsumRecords() {
    ipsumRecordsInput = [];
    ipsumRecordsTextarea = [];
    for(let i = 0; i < ipsumRecords.length; i++) {
        if (ipsumRecords[i].type === 'input') {
            ipsumRecordsInput.push(ipsumRecords[i]);
        } else if (ipsumRecords[i].type === 'textarea') {
            ipsumRecordsTextarea.push(ipsumRecords[i]);
        }
    }
}

function handleInsert(tabId, frameId)
{
    console.log('Handle insert on tab ' + tabId);
    console.log('Request element type');
    chrome.tabs.sendMessage(tabId, {
        messageType: 'custom-ipsum-get-clicked-element-type',
        payload: null
    }, {frameId: frameId}, (data) => {
        if (data !== undefined && data.value !== null) {
            console.log('Got type ' + data.value);
            let result = '';
            if (data.value === 'input') {
                if (ipsumRecordsInput.length > 0) {
                    result = ipsumRecordsInput[Math.floor(Math.random() * ipsumRecordsInput.length)].text;
                }
            }
            if (data.value === 'textarea') {
                if (ipsumRecordsTextarea.length > 0) {
                    result = ipsumRecordsTextarea[Math.floor(Math.random() * ipsumRecordsTextarea.length)].text;
                }
            }
            console.log('Filling with ' + result);
            chrome.tabs.sendMessage(tabId, {
                messageType: 'custom-ipsum-fill',
                payload: result,
            }, {frameId: frameId});
        }
    });
    // chrome.tabs.sendMessage(tabId, {
    //     messageType: 'custom-ipsum-get-clicked-element-type',
    //     payload: null
    // }, {frameId: info.frameId}, (data) => {
    //     if (data !== undefined && data.value !== null) {
    //         let result = '';
    //         if (data.value === 'input') {
    //             if (ipsumRecordsInput.length > 0) {
    //                 result = ipsumRecordsInput[Math.floor(Math.random() * ipsumRecordsInput.length)].text;
    //             }
    //         }
    //         if (data.value === 'textarea') {
    //             if (ipsumRecordsTextarea.length > 0) {
    //                 result = ipsumRecordsTextarea[Math.floor(Math.random() * ipsumRecordsTextarea.length)].text;
    //             }
    //         }
    //         chrome.tabs.sendMessage(tabId, {
    //             messageType: 'custom-ipsum-fill',
    //             payload: result,
    //         }, { frameId: info.frameId });
    //     }
    // });
}

//endregion
