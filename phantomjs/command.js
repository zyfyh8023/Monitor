//export PATH="$PATH:/Users/baidu/Documents/zouya/code/phantomjs-2.1.1-macosx/bin/"
phantom.outputEncoding="utf8";
phantom.addCookie({
    name: 'BDUSS',
    value: '3EtNnhId2lvVm9ZQ0duVDVuc2ZzcVhidEs3aHlqcTFVSzUycmxKd3lXelFFZ3RZQVFBQUFBJCQAAAAAAAAAAAEAAADH4jBxODAyM3p5ZnloAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANCF41fQheNXR',
    domain: '.baidu.com',
    path: '/',
    secure: false,
    httponly: false,
    expires: Date.now() + (1000 * 60 * 60 * 24 * 100000)
});

phantom.onError = function(msg, trace) {
    var msgStack = ['{M-ERROR}PHANTOM ERROR:' + msg];
    if(trace && trace.length) {
        msgStack.push('TRACE:');
        trace.forEach(function(t) {
            msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
        });
    }
   console.log(msgStack.join('\n'));
   console.log('{M-ERROR}自动化测试出现错误，请检查后重新开始！');
   phantom.exit(1);
 };

var system = require('system');
var semiAutomation = require('./semiAutomation.js');
var Automation = require('./automation.js');
var DiffFun = require('./diffFun.js');
var Performance = require('./performance.js');

var param1 = system.args[1];
switch (param1) {
    case '-auto':
            var param2 = system.args[2],
                param3 = system.args[3],
                param4 = system.args[4];
            var automation=new Automation({
                root: './public/DataResults/Automation/'+param2+'/',
                firstUrl: param3,
                timeNum: param4
            });
            automation.autoWalk();
        break;
    case '-autodiff':
        var param2 = system.args[2],
            param3 = system.args[3],
            param4 = system.args[4];
        var diffFun=new DiffFun({
            root: './public/DataResults/Automation/',  
            website: param2
        });
        diffFun.walkDiffFun(param3, param4);
        break;
    default:
        console.log('cli error');
        phantom.exit();
        break;
}



