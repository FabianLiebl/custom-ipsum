const DEBUG_OUTPUT = true;

// region init

let initPort = chrome.runtime.connect({
    name: "Background Connection"
});

initPort.onMessage.addListener(function(msg) {
    if (msg.hasOwnProperty('messageType')) {
        if (msg.messageType === 'custom-ipsum-records') {
            if (DEBUG_OUTPUT) { console.log('Received records'); }
            if (DEBUG_OUTPUT) { console.log(msg.payload); }

            updateRecords(msg.payload);

            initPort.disconnect();
        }
    }
});

initPort.postMessage({
    messageType: 'custom-ipsum-get-records',
    payload: null
});

// endregion

// region form

document.querySelector('[data-add-ipsum]').addEventListener('click', () => {
    let payload = {
        type: document.querySelector('[data-new-ipsum-type]').value,
        text: document.querySelector('[data-new-ipsum-text]').value,
    };
    if (payload.text === '') {
        return;
    }

    let port = chrome.runtime.connect({
        name: "Background Connection"
    });

    port.onMessage.addListener(function(msg) {
        if (msg.hasOwnProperty('messageType')) {
            if (msg.messageType === 'custom-ipsum-success') {
                document.querySelector('[data-new-ipsum-text]').value = '';
                port.postMessage({
                    messageType: 'custom-ipsum-get-records',
                    payload: null
                });
            }
            if (msg.messageType === 'custom-ipsum-records') {
                if (DEBUG_OUTPUT) { console.log('Received records'); }
                if (DEBUG_OUTPUT) { console.log(msg.payload); }

                updateRecords(msg.payload);

                port.disconnect();
            }
        }
    });

    port.postMessage({
        messageType: 'custom-ipsum-add-record',
        payload: payload
    });
});

// endregion

// region delete

window.addEventListener('click', (event) => {
    if (event.target.matches('[data-delete-record]')) {
        const index = event.target.dataset.deleteRecord;

        let port = chrome.runtime.connect({
            name: "Background Connection"
        });

        port.onMessage.addListener(function(msg) {
            if (msg.hasOwnProperty('messageType')) {
                if (msg.messageType === 'custom-ipsum-success') {
                    port.postMessage({
                        messageType: 'custom-ipsum-get-records',
                        payload: null
                    });
                }
                if (msg.messageType === 'custom-ipsum-records') {
                    if (DEBUG_OUTPUT) { console.log('Received records'); }
                    if (DEBUG_OUTPUT) { console.log(msg.payload); }

                    updateRecords(msg.payload);

                    port.disconnect();
                }
            }
        });

        port.postMessage({
            messageType: 'custom-ipsum-delete-record',
            payload: {index: index}
        });
    }
});

// endregion

// region collapsable

const collapsables = document.querySelectorAll('[data-collapsable-button]');
for(let i = 0; i < collapsables.length; i++) {
    collapsables[i].addEventListener('click', (event) => {
        const name = event.target.closest('[data-collapsable-button]').dataset.collapsableButton;
        console.log('Collapsable button clicked: ' + name + '');
        const target = document.querySelector('[data-collapsable="' + name + '"]');
        target.classList.toggle('open');
    });
}

// endregion

function updateRecords(records)
{
    document.querySelector('[data-num-total]').innerHTML = records.length;

    const target = document.querySelector('[data-ipsum-list]');
    target.innerHTML = '';
    for(let i = 0; i < records.length; i++) {
        target.innerHTML += '<li>'
            + '<div class="delete" data-delete-record="' + i + '">X</div>'
            + '<div class="type">Type: ' + records[i].type + '</div>'
            + '<div class="text">' + records[i].text + '</div>'
            + '</li>'
    }
}
