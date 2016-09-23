//export PATH="$PATH:/Users/baidu/Documents/zouya/code/phantomjs-2.1.1-macosx/bin/"

var system = require('system');
var semiAutomation = require('./semiAutomation.js');
var Automation = require('./automation.js');
var Performance = require('./performance.js');

var action = system.args[1];
var target = system.args[2];
var root= system.args[4];
var website=system.args[6];

switch (action) {
    case '-a':
            var automation=new Automation({
                firstUrl: "http://cp01-qa-lvyou-001.cp01.baidu.com:8080/static/foreign/page/ticket/channel/channel.html",
                root: '../public/DataResults/Automation/nuomi-lvyou/'
            });
            automation.autoWalk();
        break;
    case '-s':
        var semiAutomation = new semiAutomation({
            webSite: website,
            root: root
        })
        switch (target) {
            case 'create':
                semiAutomation.getData();
                break;
            case 'diff':
                var tempArr=[];
                semiAutomation.diffDomTree(0, 3, 0, tempArr);
                break;
            default:
                console.log('-a cli error');
                phantom.exit();
                break;  
        }
        break;
    case '-p':
        var performance = new Performance({
            webSite: website,
            root: root
        })
        switch (target) {
            case 'create':
                performance.getData();
                break;
            case 'get':
                performance.getPageHar('channel', 0);
                break;
            default:
                console.log('-b cli error');
                phantom.exit();
                break;
        }
        break;
    default:
        console.log('cli error');
        phantom.exit();
        break;
}



