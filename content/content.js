const DEBUG_OUTPUT = false;

let clickedElement = null;
let clickedElementFillType = 'value';

document.addEventListener('contextmenu', function(event){
    if (DEBUG_OUTPUT) { console.log('Custom Ipsum: Context menu triggered on element'); }
    if (DEBUG_OUTPUT) { console.log(event.target); }
    clickedElement = event.target;
}, true);

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.hasOwnProperty('messageType') && message.messageType === "custom-ipsum-get-clicked-element-type") {
        if (DEBUG_OUTPUT) { console.log('Custom Ipsum: Received request for element type'); }
        if (clickedElement !== null) {
            if (clickedElement.nodeName === 'INPUT' && clickedElement.type === 'text') {
                if (DEBUG_OUTPUT) { console.log('Custom Ipsum: Sending "input"'); }
                clickedElementFillType = 'value';
                sendResponse({value: 'input'});
            } else if (clickedElement.nodeName === 'INPUT' && clickedElement.type === 'email') {
                if (DEBUG_OUTPUT) { console.log('Custom Ipsum: Sending "email"'); }
                clickedElementFillType = 'value';
                sendResponse({value: 'email'});
            } else if (clickedElement.nodeName === 'INPUT' && clickedElement.type === 'number') {
                if (DEBUG_OUTPUT) { console.log('Custom Ipsum: Sending "number"'); }
                clickedElementFillType = 'value';
                sendResponse({value: 'number'});
            } else if (clickedElement.nodeName === 'TEXTAREA') {
                if (DEBUG_OUTPUT) { console.log('Custom Ipsum: Sending "textarea"'); }
                clickedElementFillType = 'value';
                sendResponse({value: 'textarea'});
            } else if (clickedElement.closest('[contenteditable=true]') !== null) {
                if (DEBUG_OUTPUT) { console.log('Custom Ipsum: Sending "contenteditable"'); }
                clickedElementFillType = 'html';
                sendResponse({value: 'contenteditable'});
            } else {
                if (DEBUG_OUTPUT) { console.log('Custom Ipsum: Sending null'); }
                sendResponse({value: null});
            }
        } else {
            if (DEBUG_OUTPUT) { console.log('Custom Ipsum: Sending null'); }
            sendResponse({value: null});
        }
        return;
    }
    if (message.hasOwnProperty('messageType') && message.messageType === "custom-ipsum-fill") {
        if (clickedElementFillType === 'value') {
            if (clickedElement.selectionStart || clickedElement.selectionStart === 0) {
                let startPos = clickedElement.selectionStart;
                let endPos = clickedElement.selectionEnd;
                clickedElement.value = clickedElement.value.substring(0, startPos)
                    + message.payload
                    + clickedElement.value.substring(endPos, clickedElement.value.length);
            } else {
                clickedElement.value += message.payload;
            }
        } else if (clickedElementFillType === 'html') {
            const editableTarget = clickedElement.closest('[contenteditable=true]');
            if (editableTarget !== null) {
                if (
                    editableTarget.innerHTML.trim() === '<p><br class="ProseMirror-trailingBreak"></p>'
                    || editableTarget.innerHTML.trim() === '<p><br data-mce-bogus="1"></p>'
                ) {
                    editableTarget.innerHTML = '';
                }
                editableTarget.innerHTML = editableTarget.innerHTML + '<p>' + message.payload + '</p>';
            }
        }
    }
});

window.addEventListener('click', function(event){
    if (event.altKey && event.ctrlKey) {
        if ((event.target.nodeName === 'INPUT' && event.target.type === 'text')
            || (event.target.nodeName === 'INPUT' && event.target.type === 'email')
            || (event.target.nodeName === 'INPUT' && event.target.type === 'number')
            || (event.target.nodeName === 'TEXTAREA')
            || (event.target.closest('[contenteditable=true]') !== null)
        ) {
            clickedElement = event.target;
            if (DEBUG_OUTPUT) { console.log('Custom Ipsum: Requesting insert'); }
            chrome.runtime.sendMessage({
                messageType: 'custom-ipsum-request-insert',
                payload: null,
            });
        } else if (event.target.nodeName === 'DIV' && event.target.classList.contains('wysiwyg-editor')) {
            clickedElement = event.target.querySelector('[contenteditable=true]');
            if (DEBUG_OUTPUT) { console.log('Custom Ipsum: Requesting insert'); }
            chrome.runtime.sendMessage({
                messageType: 'custom-ipsum-request-insert',
                payload: null,
            });
        }
    }
});
