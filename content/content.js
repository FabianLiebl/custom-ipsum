var clickedElement = null;

document.addEventListener("contextmenu", function(event){
    clickedElement = event.target;
}, true);

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.hasOwnProperty('messageType') && message.messageType === "custom-ipsum-get-clicked-element-type") {
        if (clickedElement !== null) {
            if (clickedElement.nodeName === 'INPUT') {
                sendResponse({value: 'input'});
            } else if (clickedElement.nodeName === 'TEXTAREA') {
                sendResponse({value: 'textarea'});
            } else {
                sendResponse({value: null});
            }
        }
        return;
    }
    if (message.hasOwnProperty('messageType') && message.messageType === "custom-ipsum-fill") {
        clickedElement.value = message.payload;
    }
});
