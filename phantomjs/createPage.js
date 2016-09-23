// deps
var webpage = require('webpage');
var _ = require('./util.js');


if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = function() {
        function pad(n) {
            return n < 10 ? '0' + n : n;
        }

        function ms(n) {
            return n < 10 ? '00' + n : n < 100 ? '0' + n : n
        }
        return this.getFullYear() + '-' +
            pad(this.getMonth() + 1) + '-' +
            pad(this.getDate()) + 'T' +
            pad(this.getHours()) + ':' +
            pad(this.getMinutes()) + ':' +
            pad(this.getSeconds()) + '.' +
            ms(this.getMilliseconds()) + 'Z';
    }
}

function createHAR(address, title, startTime, endTime, resources) {
    var entries = [];

    resources.forEach(function(resource) {
        var request = resource.request,
            startReply = resource.startReply,
            endReply = resource.endReply;

        if (!request || !startReply || !endReply) {
            return;
        }

        // Exclude Data URI from HAR file because
        // they aren't included in specification
        if (request.url.match(/(^data:image\/.*)/i)) {
            return;
        }
        entries.push({
            startedDateTime: request.time.toISOString(),
            time: endReply.time - request.time,
            request: {
                method: request.method,
                url: request.url,
                httpVersion: "HTTP/1.1",
                cookies: [],
                headers: request.headers,
                queryString: [],
                headersSize: -1,
                bodySize: -1
            },
            response: {
                status: endReply.status,
                statusText: endReply.statusText,
                httpVersion: "HTTP/1.1",
                cookies: [],
                headers: endReply.headers,
                redirectURL: "",
                headersSize: -1,
                bodySize: startReply.bodySize,
                content: {
                    size: startReply.bodySize,
                    mimeType: endReply.contentType
                }
            },
            cache: {},
            timings: {
                blocked: 0,
                dns: -1,
                connect: -1,
                send: 0,
                wait: startReply.time - request.time,
                receive: endReply.time - startReply.time,
                ssl: -1
            },
            pageref: address
        });
    });

    return {
        log: {
            version: '1.2',
            creator: {
                name: "PhantomJS",
                version: phantom.version.major + '.' + phantom.version.minor +
                    '.' + phantom.version.patch
            },
            pages: [{
                startedDateTime: startTime.toISOString(),
                id: address,
                title: title,
                pageTimings: {
                    onLoad: endTime - startTime
                }
            }],
            entries: entries
        }
    };
}

/**
 * create webpage and bind events
 * @param {string} url
 * @param {object} options
 * @param {Function} onload
 */
function createPage(url, onload) {
    var page = webpage.create();

    var allEventQueue = []; //页面绑定事件的队列
    page.resources = [];
    //page event
    page.onAlert = function(msg) {
        _.logFun('ALERT: ' + msg);
    };
    page.onConfirm = function(msg) {
        _.logFun('CONFIRM: ' + msg);
        return true; // `true` === pressing the "OK" button, `false` === pressing the "Cancel" button
    };
    page.onPrompt = function(msg, defaultVal) {
        if (msg === "What's your name?") {
            return 'PhantomJS';
        }
        return defaultVal;
    };
    page.onConsoleMessage = function(msg, lineNum, sourceId) {
        console.log(msg);
        _.logFun('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
    };
    page.onClosing = function(closingPage) {
        _.logFun('The page is closing! URL: ' + closingPage.url);
    };
    page.onError = function(msg, trace) {
        var msgStack = ['ERROR: ' + msg];
        if (trace && trace.length) {
            msgStack.push('TRACE:');
            trace.forEach(function(t) {
                msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function+'")' : ''));
            });
        }
        _.logFun(msgStack.join('\n'));
    };
    page.onLoadFinished = function(status) {
        _.logFun('Status: ' + status);
        // Do other things here...
    };
    page.onLoadStarted = function() {
        // console.log('onLoadStarted');
        page.startTime = new Date();
        var currentUrl = page.evaluate(function() {
            return window.location.href;
        });
        _.logFun('Current page ' + currentUrl + ' will gone...');
        _.logFun('Now loading a new page...');
    };
    page.onNavigationRequested = function(url, type, willNavigate, main) {
        _.logFun('Trying to navigate to: ' + url);
        _.logFun('Caused by: ' + type);
        _.logFun('Will actually navigate: ' + willNavigate);
        _.logFun('Sent from the page\'s main frame: ' + main);
    }
    page.onPageCreated = function(newPage) {
        _.logFun('A new child page was created! Its requested URL is not yet available, though.');
        // Decorate
        newPage.onClosing = function(closingPage) {
            _.logFun('A child page is closing: ' + closingPage.url);
        };
    };
    page.onResourceTimeout = function(request) {
        _.logFun('Response (#' + request.id + '): ' + JSON.stringify(request));
    };
    page.onResourceError = function(resourceError) {
        _.logFun('Unable to load resource (#' + resourceError.id + 'URL:' + resourceError.url + ')');
        _.logFun('Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString);
    };
    page.onResourceReceived = function(response) {
        if (response.stage === 'start') {
            page.resources[response.id].startReply = response;
        }
        if (response.stage === 'end') {
            page.resources[response.id].endReply = response;
        }
        _.logFun('Response (#' + response.id + ', stage "' + response.stage + '"): ' + JSON.stringify(response));
    };
    page.onResourceRequested = function(requestData, networkRequest) {
        page.resources[requestData.id] = {
            request: requestData,
            startReply: null,
            endReply: null
        };
        _.logFun('Request (#' + requestData.id + '): ' + JSON.stringify(requestData));
    };
    page.onInitialized = function() {
        page.evaluate(function() {
            document.addEventListener('DOMContentLoaded', function() {
                _.logFun('DOM content has loaded.');
            }, false);
        });
    };
    page.onUrlChanged = function(targetUrl) {
        _.logFun('New URL: ' + targetUrl);
    };

    //config
    page.settings.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4';
    page.viewportSize = {
        width: 414,
        height: 736
    };
    // 拍照区域
    // page.clipRect = {
    //     top: 0,
    //     left: 0,
    //     width: 414,
    //     height: 1500
    // };
    //open page
    page.open(url, function(status) {
        if (status === 'success') {
            page.endTime = new Date();
            page.title = page.evaluate(function() {
                return document.title;
            });
            har = createHAR(url, page.title, page.startTime, page.endTime, page.resources);
            //回调函数
            onload && onload(page, har);
        } else {
            _.logFun('load page error [' + page.errorReason + ']', _.log.ERROR);
            phantom.exit(1);
        }
    });
    return page;
}

module.exports = createPage;

