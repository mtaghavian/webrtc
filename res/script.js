var HTTP_STATUS_CODES = {
    '0'   : 'Connection Error',
    '200' : 'OK',
    '201' : 'Created',
    '202' : 'Accepted',
    '203' : 'Non-Authoritative Information',
    '204' : 'No Content',
    '205' : 'Reset Content',
    '206' : 'Partial Content',
    '300' : 'Multiple Choices',
    '301' : 'Moved Permanently',
    '302' : 'Found',
    '303' : 'See Other',
    '304' : 'Not Modified',
    '305' : 'Use Proxy',
    '307' : 'Temporary Redirect',
    '400' : 'Bad Request',
    '401' : 'Unauthorized',
    '402' : 'Payment Required',
    '403' : 'Forbidden',
    '404' : 'Not Found',
    '405' : 'Method Not Allowed',
    '406' : 'Not Acceptable',
    '407' : 'Proxy Authentication Required',
    '408' : 'Request Timeout',
    '409' : 'Conflict',
    '410' : 'Gone',
    '411' : 'Length Required',
    '412' : 'Precondition Failed',
    '413' : 'Request Entity Too Large',
    '414' : 'Request-URI Too Long',
    '415' : 'Unsupported Media Type',
    '416' : 'Requested Range Not Satisfiable',
    '417' : 'Expectation Failed',
    '500' : 'Internal Server Error',
    '501' : 'Not Implemented',
    '502' : 'Bad Gateway',
    '503' : 'Service Unavailable',
    '504' : 'Gateway Timeout',
    '505' : 'HTTP Version Not Supported'
};

var fadeDelay = 500;

$(document.body).prop("tabindex","-1");

$.ajaxSetup({
    contentType: "application/json; charset=utf-8"
});

function sendGet(sendUrl, sfunc) {
    $.ajax({
        url: sendUrl,
        type: "GET",
        error: function (data, status) {
        },
        success: function (data, status) {
            if(sfunc) {
                sfunc(data);
            }
        }
    });
}

function isIOS() {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
  // iPad on iOS 13 detection
  || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

function base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

function sendPost(sendUrl, data, sfunc) {
    $.ajax({
        url: sendUrl,
        type: "POST",
        error: function (data, status) {
        },
        success: function (data, status) {
            if(sfunc) {
                sfunc(data);
            }
        },
        data: data
    });
}

function getNotificationPermission() {
    if(!isIOS()) {
        if (Notification.permission !== "granted") {
            Notification.requestPermission(function(result) {
                if (result === 'granted') {
                    console.log("Notifications granted!");
                }
            });
        }
    }
}

function handleUIVersion() {
    $.ajax({
        url: "/api/uiVersion",
        type: "GET",
        error: function (data, status) {
            onerror(data);
        },
        success: function (data, status) {
            if(!hasCookie("uiVersion")) {
                setCookie("uiVersion", data);
                return;
            }
            if(getCookie("uiVersion") !== data) {
                setCookie("uiVersion", data);
                clearCache();
                console.log("UI updated! UIVersion: " + data);
            }
        }
    });
}

function humanFileSize(size) {
    var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = 0;
    while(size >= 1024) {
        size /= 1024;
        ++i;
    }
    return size.toFixed(1) + ' ' + units[i];
}

function load(addr) {
    if(hasParent()) {
        window.parent.loadInParent(addr);
    } else {
        window.location.href = "/";
    }
}

function returnPage() {
    if(hasParent()) {
        window.parent.returnPageInParent();
    } else {
        window.location.href = "/";
    }
}

function notify(status, msg, time) {
    if(hasParent()) {
        window.parent.notifyInParent(status, msg, time);
    } else {
        UIkit.notification({message: msg, status: status, pos: 'bottom-center', timeout: time})
    }
}

function notifyInSystem(msg, time) {
    const notification = new Notification('Notification', {
        body: msg,
        icon: '/favicon.svg'
    });
    setTimeout(function() { notification.close() }, time);
}

function getRelativeDate(milis) {
    var timeDate = new Date(milis);
    var timeStr = timeDate.toLocaleDateString();
    if(timeStr === new Date().toLocaleDateString()) {
        return "Today";
    } else if(timeStr === new Date((new Date().getTime()) - 86400000).toLocaleDateString()) {
        return "Yesterday";
    } else if(milis < ((new Date().getTime()) - 31536000000)) { // more than 1 year
        return timeStr;
    } else if(milis > ((new Date().getTime() - 604800000))) { // less than 1 week
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return dayNames[timeDate.getDay()];
    } else {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return monthNames[timeDate.getMonth()] + "/" + timeDate.getDate();
    }
}

function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return '<a target="_blank" href="' + url + '">' + url + '</a>';
    });
}

function clearCache() {
    $.ajax({
        url: "/api/clearCache",
        type: "GET",
        success: function (data, status) {
            //location.reload();
        }
    });
}

function copyClipboard(data, msg) {
    navigator.clipboard.writeText(data)
        .then(() => { notify("primary", msg, 2000); })
        .catch((error) => { notify("warning", "Unsuccessful copy to clipboard!", 2000); });
}

var isRTL = function(s){
    var ltrChars    = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF'+'\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF',
        rtlChars    = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC',
        rtlDirCheck = new RegExp('^[^'+ltrChars+']*['+rtlChars+']');
    return rtlDirCheck.test(s);
}

function getTime(milis) {
    var timeDate = new Date(milis);
    var hour = "" + timeDate.getHours();
    var min = "" + timeDate.getMinutes();
    hour = (hour.length === 1) ? "0" + hour : hour;
    min = (min.length === 1) ? "0" + min : min;
    return hour + ":" + min;
}

function onerror(data) {
    var text = HTTP_STATUS_CODES[data.status];
    UIkit.notification({message: text, status: 'warning', pos: 'bottom-center', timeout: 1000})
}

function hasParent() {
    return window.parent.loadInParent;
}

function fromHex(hex) {
    var str = '';
    for (var i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
}

function toHex(str) {
    var hex = '';
    for(var i=0;i<str.length;i++) {
        var p = str.charCodeAt(i).toString(16);
        hex += (p.length === 1) ? ('0' + p) : p;
    }
    return hex;
}

function deleteCookie(key) {
    key = toHex(key);
    document.cookie = key + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

function setCookie(key, value) {
    key = toHex(key);
    value = toHex(value);
    let date = new Date();
    let days = 365;
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    let expires = "expires=" + date.toUTCString();
    document.cookie = key + "=" + value + ";" + expires + ";path=/";
}

function hasCookie(key) {
    key = toHex(key);
    return (document.cookie.indexOf(key + "=") >= 0);
}

function getCookie(key) {
    key = toHex(key);
    let name = key + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(name) === 0) {
            return fromHex(c.substring(name.length, c.length));
        }
    }
    return "";
}

function createLoadingSpinner() {
    var spinnerHolder = document.createElement('div');
    spinnerHolder.style.textAlign = "center";

    var holder = document.createElement('div');
    holder.style.display = "inline";
    holder.style.padding = "30px";

    var spinner = document.createElement('div');
    spinner.style.color = "black";
    spinner.style.display = "block";
    spinner.style.paddingBottom = "15px";
    spinner.setAttribute("uk-spinner", "ratio: 1.3");
    holder.append(spinner);

    var spinnerText = document.createElement('span');
    spinnerText.style.color = "black";
    spinnerText.innerHTML = "Please wait";
    holder.append(spinnerText);

    var text = document.createElement('div');
    text.setAttribute("id", "LoadingSpinnerText");
    text.style.color = spinner.style.color;
    text.style.padding = "15px";
    text.style.fontSize = "85%";
    text.style.textAlign = "left";
    holder.append(text);

    spinnerHolder.append(holder);

    var div1 = document.createElement('div');
    div1.classList.add("uk-modal-dialog");
    div1.classList.add("uk-margin-auto-vertical");
    div1.classList.add("Centered");
    div1.style.padding = "20px";
    div1.append(spinnerHolder);

    var div2 = document.createElement('div');
    div2.classList.add("uk-flex-top");
    div2.setAttribute("id", "LoadingSpinner");
    div2.setAttribute("uk-modal", "true");
    div2.append(div1);

    document.body.append(div2);
}
function showLoading() {
    //$("#LoadingSpinner").fadeIn(100);
    UIkit.modal($("#LoadingSpinner")).show();
}
function hideLoading() {
    //$("#LoadingSpinner").fadeOut(100);
    $("#LoadingSpinnerText").text("");
    $("#LoadingSpinner").hide();
    UIkit.modal($("#LoadingSpinner")).hide();
}
