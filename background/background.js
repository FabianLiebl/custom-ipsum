const DEBUG_OUTPUT = true;

var ipsumRecords = [];
var ipsumRecordsInput = [];
var ipsumRecordsTextarea = [];
var ipsumRecordsEmail = [];
var ipsumRecordsNumber = [];

initContextMenu();
initInternalCommunication();

function initContextMenu()
{
    chrome.runtime.onInstalled.addListener(async () => {
        chrome.contextMenus.create({
            id: 'customIpsumContextMenuFill',
            title: 'Fill with Custom Ipsum',
            type: 'normal',
            contexts: ['editable'],
        });
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
        loadStorage().then(() => {
            handleInsert(tab.id, info.frameId);
        });
    });
}

function loadStorage()
{
    return chrome.storage.local.get(['ipsum-records']).then((result) => {
        if (DEBUG_OUTPUT) { console.log('Loading records from storage:'); }
        if (DEBUG_OUTPUT) { console.log(result); }
        if (result.hasOwnProperty('ipsum-records')) {
            ipsumRecords = result['ipsum-records'];
            sortIpsumRecords();
        } else {
            ipsumRecords = [];
            ipsumRecordsInput = [];
            ipsumRecordsTextarea = [];
        }
    });
}

function initInternalCommunication()
{
    chrome.runtime.onConnect.addListener(function(port) {
        port.onMessage.addListener(function(msg) {
            if (msg.hasOwnProperty('messageType')) {
                if (msg.messageType === 'custom-ipsum-add-record') {
                    loadStorage().then(() => {
                        addRecord(msg.payload.type, msg.payload.text, (result) => {
                            port.postMessage({
                                messageType: 'custom-ipsum-success',
                                payload: true,
                            });
                        });
                    });
                }
                if (msg.messageType === 'custom-ipsum-delete-record') {
                    loadStorage().then(() => {
                        deleteRecord(msg.payload.index, (result) => {
                            port.postMessage({
                                messageType: 'custom-ipsum-success',
                                payload: true,
                            });
                        });
                    });
                }
                if (msg.messageType === 'custom-ipsum-get-records') {
                    loadStorage().then(() => {
                        if (DEBUG_OUTPUT) { console.log('Sending records'); }
                        if (DEBUG_OUTPUT) { console.log(ipsumRecords); }
                        port.postMessage({
                            messageType: 'custom-ipsum-records',
                            payload: ipsumRecords,
                        });
                    });
                }
            }
        });
    });

    chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
        if (msg.hasOwnProperty('messageType')) {
            if (msg.messageType === 'custom-ipsum-request-insert') {
                loadStorage().then(() => {
                    handleInsert(sender.tab.id, sender.frameId);
                });
            }
        }
    });
}

function sortIpsumRecords()
{
    ipsumRecordsInput = [];
    ipsumRecordsTextarea = [];
    ipsumRecordsEmail = [];
    ipsumRecordsNumber = [];
    for(let i = 0; i < ipsumRecords.length; i++) {
        if (ipsumRecords[i].type === 'input') {
            ipsumRecordsInput.push(ipsumRecords[i]);
        } else if (ipsumRecords[i].type === 'textarea') {
            ipsumRecordsTextarea.push(ipsumRecords[i]);
        } else if (ipsumRecords[i].type === 'email') {
            ipsumRecordsEmail.push(ipsumRecords[i]);
        } else if (ipsumRecords[i].type === 'number') {
            ipsumRecordsNumber.push(ipsumRecords[i]);
        }
    }
}

function saveIpsumRecords()
{
    return chrome.storage.local.set({
        'ipsum-records': ipsumRecords
    });
}

function addRecord(type, text, callback)
{
    ipsumRecords.push({
        type: type,
        text: text
    });
    saveIpsumRecords()
        .then((result) => {
            callback(result);
        });
}

function deleteRecord(index, callback)
{
    const indexNumber = Number(index);
    if (DEBUG_OUTPUT) { console.log('Deleting record at index ' + indexNumber); }

    let newIpsumRecords = [];
    for(let i = 0; i < ipsumRecords.length; i++) {
        if (i === indexNumber) {
            continue;
        }
        newIpsumRecords.push(ipsumRecords[i]);
    }
    ipsumRecords = newIpsumRecords;
    sortIpsumRecords();

    saveIpsumRecords()
        .then((result) => {
            callback(result);
        });
}

function handleInsert(tabId, frameId)
{
    if (DEBUG_OUTPUT) { console.log('Handle insert on tab ' + tabId + ' frame ' + frameId); }
    if (DEBUG_OUTPUT) { console.log('Request element type'); }
    chrome.tabs.sendMessage(tabId, {
        messageType: 'custom-ipsum-get-clicked-element-type',
        payload: null
    }, {frameId: frameId}, (data) => {
        if (data !== undefined && data.hasOwnProperty('value')) {
            if (DEBUG_OUTPUT) { console.log('Got type ' + data.value); }
            let result = '';
            if (data.value === 'input') {
                if (ipsumRecordsInput.length > 0) {
                    result = ipsumRecordsInput[Math.floor(Math.random() * ipsumRecordsInput.length)].text;
                } else {
                    result = 'Lorem ipsum dolor sit amet';
                }
            }
            if (data.value === 'textarea') {
                if (ipsumRecordsTextarea.length > 0) {
                    result = ipsumRecordsTextarea[Math.floor(Math.random() * ipsumRecordsTextarea.length)].text;
                } else {
                    result = 'Lorem ipsum dolor sit amet consectetur adipiscing elit cursus, himenaeos sodales per habitant ultricies mauris magna lacus vitae, tellus nulla parturient bibendum dictumst condimentum conubia.';
                }
            }
            if (data.value === 'email') {
                if (ipsumRecordsEmail.length > 0) {
                    result = ipsumRecordsEmail[Math.floor(Math.random() * ipsumRecordsEmail.length)].text;
                } else {
                    result = 'test@email.com';
                }
            }
            if (data.value === 'number') {
                if (ipsumRecordsNumber.length > 0) {
                    result = ipsumRecordsNumber[Math.floor(Math.random() * ipsumRecordsNumber.length)].text;
                } else {
                    result = 1;
                }
            }
            if (data.value === 'contenteditable') {
                if (ipsumRecordsTextarea.length > 0) {
                    result = ipsumRecordsTextarea[Math.floor(Math.random() * ipsumRecordsTextarea.length)].text;
                } else {
                    result = 'Lorem ipsum dolor sit amet consectetur adipiscing elit cursus, himenaeos sodales per habitant ultricies mauris magna lacus vitae, tellus nulla parturient bibendum dictumst condimentum conubia.';
                }
            }
            if (DEBUG_OUTPUT) { console.log('Filling with "' + result + '"'); }
            chrome.tabs.sendMessage(tabId, {
                messageType: 'custom-ipsum-fill',
                payload: result,
            }, {frameId: frameId});
        }
    });
}
