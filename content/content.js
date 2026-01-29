var clickedElement = null;

document.addEventListener('contextmenu', function(event){
    clickedElement = event.target;
}, true);

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.hasOwnProperty('messageType') && message.messageType === "custom-ipsum-get-clicked-element-type") {
        console.log('Received request for element type');
        if (clickedElement !== null) {
            if (clickedElement.nodeName === 'INPUT' && clickedElement.type === 'text') {
                console.log('Sending "input"');
                sendResponse({value: 'input'});
            } else if (clickedElement.nodeName === 'TEXTAREA') {
                console.log('Sending "textarea"');
                sendResponse({value: 'textarea'});
            } else {
                console.log('Sending null');
                sendResponse({value: null});
            }
        } else {
            console.log('Sending null');
            sendResponse({value: null});
        }
        return;
    }
    if (message.hasOwnProperty('messageType') && message.messageType === "custom-ipsum-fill") {
        clickedElement.value = message.payload;
    }
});

window.addEventListener('click', function(event){
    if (event.altKey && event.ctrlKey) {
        if (event.target.nodeName === 'INPUT' && event.target.type === 'text') {
            clickedElement = event.target;
            console.log('Request insert');
            chrome.runtime.sendMessage({
                messageType: 'custom-ipsum-request-insert',
                payload: null,
            });
        } else if (event.target.nodeName === 'TEXTAREA') {
            clickedElement = event.target;
            console.log('Request insert');
            chrome.runtime.sendMessage({
                messageType: 'custom-ipsum-request-insert',
                payload: null,
            });
        }
    }
});
