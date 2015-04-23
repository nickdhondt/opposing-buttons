var streamErrors = 0;
var lastError = time();
var lastTimestamp = 0;
var fallbackMessage= false;
var prevNoticeTimeout = 0;
var lastFallbackConnection = time();
var fatalError = false;
var red = 0;
var blue = 0;
var lastClick = 0;
var autoClose = false;

Array.prototype.max = function() {
    return Math.max.apply(null, this);
};

function init() {
    document.getElementById("sendClick").addEventListener("click", updateData);
    document.getElementById("sendOtherClick").addEventListener("click", updateData);
    document.getElementById("closeNotice").addEventListener("click", closeNotice);
    showNotice("Voor deze app zijn <em>Mozilla Firefox</em> of Google Chrome aan te raden.");
    openStream();
    setInterval(maintainStats, 10000);
}

function formatNumber(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function closeNotice() {
    var notice = document.getElementById("notice");
    var closeNotice = document.getElementById("closeNotice");

    notice.style.opacity = "0";
    closeNotice.style.opacity = "0";
}

function showNotice(message, keepAlive) {
    clearTimeout(prevNoticeTimeout);
    var notice = document.getElementById("notice");
    var closeNoticeCross = document.getElementById("closeNotice");

    notice.style.opacity = "1";
    closeNoticeCross.style.opacity = "1";
    notice.innerHTML = message;

    if (keepAlive != true) {
        prevNoticeTimeout = setTimeout(closeNotice, 10000);
        autoClose = true;
    } else {
        autoClose = false;
    }
}

function maintainStats() {
    var blueBar = document.getElementById("statBarBlue");
    var redBar = document.getElementById("statBarRed");

    var percentRed = Math.round(parseInt(red) / (parseInt(red) + parseInt(blue)) * 100);
    var percentBlue = Math.round(parseInt(blue) / (parseInt(red) + parseInt(blue)) * 100);

    console.log(percentBlue + " + " + percentRed);
    console.log(red + " + " + blue);

    redBar.style.width  = (percentRed / 2) + "vw";
    redBar.style.marginLeft = (percentBlue / 2) + "vw";
    blueBar.style.width = (percentBlue / 2) + "vw";
    blueBar.style.marginRight = (percentRed / 2) + "vw";
}

function updateData() {
    if (lastClick < microtime(true) - .1) {
        var action = this.id;

        switch (action) {
            case "sendClick":
                sendXHR(0);
                updateField(action);
                break;
            case "sendOtherClick":
                sendXHR(1);
                updateField(action);
                break;
        }
        lastClick = microtime(true);
    }
}

function updateField(buttonId) {
    var fieldId;
    var number;

    switch  (buttonId) {
        case "sendClick":
            fieldId = "rtData";
            number = red;
            red++;
            break;
        case "sendOtherClick":
            fieldId = "rtOtherData";
            number = blue;
            blue++;
            break;
    }
    var rtData = document.getElementById(fieldId);

    rtData.innerHTML = formatNumber(parseInt(number) + 1);
}

function sendXHR(type) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var response = xhr.responseText;

            if (response != 1) {
                showNotice("+1 niet geregistreerd. Er is een serverfout opgetreden.");
            }
        }
    };

    xhr.onerror = function() { showNotice("+1 niet verzonden. Er zijn netwerkproblemen."); };

    xhr.open("post", "sse/xhr.php");
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send("type=" + type);
}

function time() {
    return Math.floor(Date.now() / 1000);
}

function microtime(get_as_float) {
    var now = new Date()
            .getTime() / 1000;
    var s = parseInt(now, 10);

    return (get_as_float) ? now : (Math.round((now - s) * 1000) / 1000) + ' ' + s;
}


function checkForFallback() {
    if (lastError < (time() - 30) || streamErrors > 1) {
        if (fallbackMessage == false) {
            fallbackMessage = true;

            showNotice("Real time verbinding verbroken. Intervalverbinding wordt nu gemaakt.", true);
        }

        fallbackBeat();
    }
}

function fallbackBeat() {
    var xhr = new XMLHttpRequest();

    var rtData = document.getElementById("rtData");
    var rtOtherData = document.getElementById("rtOtherData");

    var timestamps = [];

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {

            lastFallbackConnection = time();

            var response = xhr.responseText;
            var receivedData = JSON.parse(response);
            var counter = 0;
            var dataLength = receivedData.length;

            if (dataLength >= 1) {
                while(counter < dataLength) {
                    if (receivedData[counter].type == 0) {
                        rtData.innerHTML = formatNumber(receivedData[counter].value);
                        red = receivedData[counter].value;
                        timestamps.push(receivedData[counter].timestamp);
                    } else if (receivedData[counter].type == 1) {
                        rtOtherData.innerHTML = formatNumber(receivedData[counter].value);
                        blue = receivedData[counter].value;
                        timestamps.push(receivedData[counter].timestamp);
                    }
                    counter++;
                }
                if (lastTimestamp < timestamps.max()) {
                    lastTimestamp = timestamps.max();
                }
            }

            if (lastTimestamp < timestamps.max()) {
                lastTimestamp = timestamps.max();
            }
            maintainStats();
        }
    };

    xhr.open("get", "sse/xhrpush.php?lasttime=" + lastTimestamp);
    xhr.send();
}

function openStream() {
    var eventSource = new EventSource("sse/rtpush.php");
    var rtData = document.getElementById("rtData");
    var rtOtherData = document.getElementById("rtOtherData");

    setInterval(noConnectionErrors, 1000);
    setInterval(checkForFallback, 3000);

    setInterval( function() {
        if (eventSource.readyState == 1) {
            fallbackMessage = false;
            streamErrors = 0;
            fatalError = false;
        }
    }, 1000);

    eventSource.onmessage = function(e) {
        var receivedData = JSON.parse(e.data);
        var dataLength = receivedData.length;
        var counter = 0;
        var timestamps = [];

        if (dataLength >= 1) {
            while(counter < dataLength) {
                if (receivedData[counter].type == 0) {
                    rtData.innerHTML = formatNumber(receivedData[counter].value);
                    timestamps.push(receivedData[counter].timestamp);
                    red = receivedData[counter].value;
                } else if (receivedData[counter].type == 1) {
                    rtOtherData.innerHTML = formatNumber(receivedData[counter].value);
                    timestamps.push(receivedData[counter].timestamp);
                    blue = receivedData[counter].value;
                }
                counter++;
            }
            if (lastTimestamp < timestamps.max()) {
                lastTimestamp = timestamps.max();
            }
        }
        maintainStats();
    };

    eventSource.onerror = function(e) {
        streamErrors++;
        lastError = time();
    };
}

function noConnectionErrors() {
    console.log(fatalError);
    if ((lastFallbackConnection < (time() - 5)) && streamErrors > 1 && fatalError == false) {
        showNotice("Er kan geen verbinding gemaakt worden. Overweeg een refresh.", true);
        fatalError = true;
    } else if (autoClose == false && fatalError == false){
        closeNotice();
    }
}