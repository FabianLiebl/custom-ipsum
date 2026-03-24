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

            initPort.postMessage({
                messageType: 'custom-ipsum-get-options',
                payload: null
            });
        }
        if (msg.messageType === 'custom-ipsum-options') {
            if (DEBUG_OUTPUT) { console.log('Received options'); }
            if (DEBUG_OUTPUT) { console.log(msg.payload); }

            updateOptions(msg.payload);

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

//region options

document.querySelector('[data-option-guess-email]').addEventListener('change', () => {
    sendUpdateOptions();
});
document.querySelector('[data-option-guess-link]').addEventListener('change', () => {
    sendUpdateOptions();
});

function sendUpdateOptions()
{
    let port = chrome.runtime.connect({
        name: "Background Connection"
    });

    port.onMessage.addListener(function(msg) {
        if (msg.hasOwnProperty('messageType')) {
            if (msg.messageType === 'custom-ipsum-success') {
                port.disconnect();
            }
        }
    });

    port.postMessage({
        messageType: 'custom-ipsum-set-options',
        payload: {
            guessEmail: document.querySelector('[data-option-guess-email]').checked,
            guessLink: document.querySelector('[data-option-guess-link]').checked,
        }
    });
}

//endregion

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

//region filter

document.querySelectorAll('[data-filter-type]').forEach((element) => {
    element.addEventListener('click', (event) => {
        const type = event.target.dataset.filterType;
        if (type === 'all') {
            document.querySelectorAll('[data-filter-type]').forEach((element) => {
                if (element.dataset.filterType !== 'all') {
                    element.classList.remove('active');
                } else {
                    element.classList.add('active');
                }
            });
        } else {
            if (document.querySelector('[data-filter-type="' + type + '"]').classList.contains('active')) {
                document.querySelector('[data-filter-type="' + type + '"]').classList.remove('active');
            } else {
                document.querySelector('[data-filter-type="' + type + '"]').classList.add('active');
            }
            document.querySelector('[data-filter-type="all"]').classList.add('active');
            document.querySelectorAll('[data-filter-type]').forEach((element) => {
                if (element.dataset.filterType !== 'all' && element.classList.contains('active')) {
                    document.querySelector('[data-filter-type="all"]').classList.remove('active');
                }
            });
        }
        updateFilter();
    });
});

function updateFilter()
{
    if (document.querySelector('[data-filter-type="all"]').classList.contains('active')) {
        document.querySelectorAll('[data-record-type]').forEach((element) => {
            element.classList.remove('filtered-out');
        });
    } else {
        document.querySelectorAll('[data-record-type]').forEach((element) => {
            const recordType = element.dataset.recordType;
            if (document.querySelector('[data-filter-type="' + recordType + '"]').classList.contains('active')) {
                element.classList.remove('filtered-out');
            } else {
                element.classList.add('filtered-out');
            }
        });
    }
}

//endregion

function updateRecords(records)
{
    document.querySelector('[data-num-total]').innerHTML = records.length;

    const target = document.querySelector('[data-ipsum-list]');
    target.innerHTML = '';
    for(let i = 0; i < records.length; i++) {
        target.innerHTML +=
            '<li data-record-type="' + records[i].type + '">'
            + '<div class="delete" data-delete-record="' + i + '">X</div>'
            + '<div class="type"><b>Type:</b> ' + records[i].type + '</div>'
            + '<div class="text">' + records[i].text + '</div>'
            + '</li>'
    }
    updateFilter();
}

function updateOptions(options)
{
    document.querySelector('[data-option-guess-email]').checked = options.guessEmail;
    document.querySelector('[data-option-guess-link]').checked = options.guessLink;
}
