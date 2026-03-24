const DEBUG_OUTPUT = true;

var ipsumRecords = [];
var ipsumRecordsInput = [];
var ipsumRecordsTextarea = [];
var ipsumRecordsEmail = [];
var ipsumRecordsNumber = [];
var ipsumRecordsLink = [];
var guessEmail = true;
var guessLink = true;

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
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['ipsum-records']).then((result) => {
            if (DEBUG_OUTPUT) { console.log('Loading records from storage:'); }
            if (DEBUG_OUTPUT) { console.log(result); }
            if (result.hasOwnProperty('ipsum-records')) {
                ipsumRecords = result['ipsum-records'];
                sortIpsumRecords();
            } else {
                ipsumRecords = [];
                ipsumRecordsInput = [];
                ipsumRecordsTextarea = [];
                ipsumRecordsEmail = [];
                ipsumRecordsNumber = [];
                ipsumRecordsLink = [];
            }
            chrome.storage.local.get(['ipsum-options']).then((result) => {
                if (result.hasOwnProperty('guess-email')) {
                    guessEmail = result['guessEmail'];
                }
                if (result.hasOwnProperty('guess-link')) {
                    guessLink = result['guessLink'];
                }
                resolve();
            });
        });
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
                if (msg.messageType === 'custom-ipsum-set-options') {
                    loadStorage().then(() => {
                        guessEmail = msg.payload.guessEmail;
                        guessLink = msg.payload.guessLink;
                        saveOptions()
                            .then(() => {
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
                if (msg.messageType === 'custom-ipsum-get-options') {
                    loadStorage().then(() => {
                        if (DEBUG_OUTPUT) { console.log('Sending options'); }
                        if (DEBUG_OUTPUT) { console.log(ipsumRecords); }
                        port.postMessage({
                            messageType: 'custom-ipsum-options',
                            payload: {
                                guessEmail: guessEmail,
                                guessLink: guessLink,
                            },
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
    ipsumRecordsLink = [];
    for(let i = 0; i < ipsumRecords.length; i++) {
        if (ipsumRecords[i].type === 'input') {
            ipsumRecordsInput.push(ipsumRecords[i]);
        } else if (ipsumRecords[i].type === 'textarea') {
            ipsumRecordsTextarea.push(ipsumRecords[i]);
        } else if (ipsumRecords[i].type === 'email') {
            ipsumRecordsEmail.push(ipsumRecords[i]);
        } else if (ipsumRecords[i].type === 'number') {
            ipsumRecordsNumber.push(ipsumRecords[i]);
        } else if (ipsumRecords[i].type === 'link') {
            ipsumRecordsLink.push(ipsumRecords[i]);
        }
    }
}

function saveIpsumRecords()
{
    return chrome.storage.local.set({
        'ipsum-records': ipsumRecords
    });
}

function saveOptions()
{
    if (DEBUG_OUTPUT) { console.log('Saving options: guessEmail = ' + (guessEmail ? 'true' : 'false') + ', guessLink = ' + (guessLink ? 'true' : 'false')); }
    return chrome.storage.local.set({
        'ipsum-options': {
            guessEmail: guessEmail,
            guessLink: guessLink,
        }
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
                result = handleInput(data.hasOwnProperty('meta') ? data.meta : null);
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

function handleInput(meta)
{
    if (meta !== null) {
        if (guessEmail && isEmail(meta)) {
            if (ipsumRecordsEmail.length > 0) {
                return ipsumRecordsEmail[Math.floor(Math.random() * ipsumRecordsEmail.length)].text;
            } else {
                return 'test@email.com';
            }
        }
        if (guessLink && isLink(meta)) {
            if (ipsumRecordsLink.length > 0) {
                return ipsumRecordsLink[Math.floor(Math.random() * ipsumRecordsLink.length)].text;
            } else {
                return 'https://www.example.com';
            }
        }
    }

    if (ipsumRecordsInput.length > 0) {
        return ipsumRecordsInput[Math.floor(Math.random() * ipsumRecordsInput.length)].text;
    } else {
        return 'Lorem ipsum dolor sit amet';
    }
}

function isEmail(meta)
{
    if (meta.hasOwnProperty('placeholder') && meta.placeholder) {
        if (meta.placeholder.toLowerCase().includes('email')
            || meta.placeholder.toLowerCase().includes('e-mail')
        ) {
            return true;
        }
    }
    if (meta.hasOwnProperty('label') && meta.label) {
        if (meta.label.toLowerCase().includes('email')
            || meta.label.toLowerCase().includes('e-mail')
        ) {
            return true;
        }
    }
    return false;
}

function isLink(meta)
{
    if (meta.hasOwnProperty('placeholder') && meta.placeholder) {
        if (meta.placeholder.toLowerCase().includes('link')
            || meta.placeholder.toLowerCase().includes('url')
            || meta.placeholder.toLowerCase().match(/^https?:/)
        ) {
            return true;
        }
    }
    if (meta.hasOwnProperty('label') && meta.label) {
        if (meta.label.toLowerCase().includes('link')
            || meta.label.toLowerCase().includes('url')
        ) {
            return true;
        }
    }
    return false;
}
