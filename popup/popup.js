// region init

let initPort = chrome.runtime.connect({
    name: "Background Connection"
});

initPort.onMessage.addListener(function(msg) {
    if (msg.hasOwnProperty('messageType')) {
        if (msg.messageType === 'custom-ipsum-records') {
            console.log('Received records');
            console.log(msg.payload);

            updateRecords(msg);

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
                console.log('Received records');
                console.log(msg.payload);

                updateRecords(msg);

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
                    console.log('Received records');
                    console.log(msg.payload);

                    updateRecords(msg);

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

function updateRecords(msg)
{
    document.querySelector('[data-num-total]').innerHTML = msg.payload.length;

    const target = document.querySelector('[data-ipsum-list]');
    target.innerHTML = '';
    for(let i = 0; i < msg.payload.length; i++) {
        target.innerHTML += '<li>'
            + '<div class="delete" data-delete-record="' + i + '">X</div>'
            + '<div class="type">Type: ' + msg.payload[i].type + '</div>'
            + '<div class="text">' + msg.payload[i].text + '</div>'
            + '</li>'
    }
}
