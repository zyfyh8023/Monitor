// deps
var webpage = require('webpage');
var system = require('system');
var fs = require('fs');
var getDomTree = require('./getDomTree.js');

//Automation
function Automation(config) {
    this._init(config);
}

Automation.prototype = {
page: {},
//页面可点击元素
pageEventArr: [],
//自动化操作记录数组-有用的操作记录
recordArr: [],
//输出信息记录
historyRecordArr:[],
//所有打开的页面
pageList: {},
//错误页面打开次数统计对象
errorPage: {},
//最新点击元素名称
newClickName: '',
//经过的页面record list
pageListRecord: [],
//解决连续两次跳转页面的问题
urlDoubleError: -1,
//初始化
_init: function(config) {
    var self = this;

    //初始化参数-auto
    self.page = webpage.create();
    self.firstUrl = config.firstUrl; //站点的首地址
    self.root = config.root; //测试代码图片文件的根目录
    self.timeNum = config.timeNum; //测试代码的时间
    self.openPageWaitTime = config.openPageWaitTime || 7000; //打开页面之后的等待时间
    self.clickWaitTime = config.clickWaitTime || 3000;
    //page config
    self.page.settings.userAgent = config.userAgent || 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4';
    self.page.viewportSize = {
        width: config.width || 414,
        height: config.height || 736
    };
    self.page.settings.localToRemoteUrlAccessEnabled=true;
    self.page.settings.XSSAuditingEnabled=true;
    self.page.settings.javascriptEnabled=true;
    self.page.settings.loadImages=true;
    self.page.settings.resourceTimeout=10000;
    //console.log的信息输出
    self.page.onConsoleMessage = function(msg, lineNum, sourceId) {
        if(typeof msg !='string'){
            msg=JSON.stringify(msg);
        }

        if (msg.match('{new page}') || msg.match('{old page}') || msg.match('{go back}') || msg.match('{operation}')) {
            self.recordArr.push(msg);
            self.historyRecordArr.push(msg);
            console.log(msg);
        }else if(msg.match('{success}')){
            fs.write(self.root + self.timeNum + "/record.txt", self.historyRecordArr.join('\n'), {'mode': 'w', 'charset': 'utf8'});
            fs.write(self.root + self.timeNum + "/allEventList.json", JSON.stringify(self.pageEventArr), {'mode': 'w', 'charset': 'utf8'});
        }else{
            self.historyRecordArr.push(msg);
            console.log(msg);
        }
    };
    //错误输出
    self.page.onError = function(msg, trace) {
        var msgStack = ['{M-ERROR}PAGE ERROR:' + msg];
        if (trace && trace.length) {
            msgStack.push('TRACE:');
            trace.forEach(function(t) {
                msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function+'")' : ''));
            });
        }
        console.log(msgStack.join('\n'));
        console.log('{M-ERROR}页面出现错误！');
    };
    self.page.onAlert = function(msg) {
        console.log('{M-WARN}ALERT：' + msg);
    };
    self.page.onConfirm = function(msg) {
        console.log('{M-WARN}CONFIRM：' + msg);
        // `true` === pressing the "OK" button, `false` === pressing the "Cancel" button
        return true; 
    };
    self.page.onPrompt = function(msg, defaultVal) {
        return defaultVal;
    };
    self.page.onLoadFinished = function(status) {
        self.timer1=window.setTimeout(function(){
            self.bigSign=1;
        }, self.openPageWaitTime);
    };
    self.page.onNavigationRequested = function(url, type, willNavigate, main) {
        self.smallSign=0;

        if(type=='Other' && url && main && willNavigate && self.recordArr.length!=self.urlDoubleError){
            var tempObj={
                clickName: self.newClickName,
                pathName: url.replace(/^[^:]+:\/\/[^/]+/, '').replace(/#.*/, '').replace(/\?.*/, '')
            };
            self.pageListRecord.push(tempObj);
        }else if(type=='BackOrForward' && url && main && willNavigate && self.recordArr.length!=self.urlDoubleError){
            self.pageListRecord.pop();
        }else{
            if(url!='about:blank'){
                console.log('{M-WARN}特殊情况：'+url+'-'+type+'-'+willNavigate+'-'+main);
            }
            if(self.timer1) clearTimeout(self.timer1);
        }

        self.urlDoubleError=self.recordArr.length;
    };
},
_operateType: function(){
    var self=this;

    for(var k=self.recordArr.length-1; k>=0; k--){
        if(self.recordArr[k].match('{operation}')){
            return 1;
        }
        if(self.recordArr[k].match('{go back}')){
            return 2;
        }
    }
    return 0;
},
_create: function(url, onload) {
    var self = this;

    self.page.open(url, function(status) {
        if (status === 'success') {
            onload && onload(self.page, url);
        } else {
            var Timer = window.setTimeout(function() {
                clearTimeout(Timer);
                if(self.errorPage[url]){
                    self.errorPage[url]+=1;
                }else{
                    self.errorPage[url]=1;
                }
                if(self.errorPage[url]>10){
                    var tempInfo = '新页面[' + url + ']打开失败次数太多，我放弃了。。。';
                    console.log(tempInfo);
                    phantom.exit(1);
                }else{
                    var tempInfo = '{new page}新页面[' + url + ']打开失败，1.5s后再次尝试打开。';
                    console.log(tempInfo);
                    self._create(url, onload);
                }
            }, 1500);
        }
    });
},
_pageUrl: function() {
    var self = this;

    return {
        'path_name': window.location.pathname,
        'page_url': window.location.href,
        'nickName': window.mPageName || ('promotionPg('+ window.location.pathname.replace(/\//g, "-").replace(/(^-*)|(-*$)/g, '')+')'),
        'referrer': document.referrer
    };
},
_referrerNickName: function(referrer) {
    var self = this;

    var referrerChg = referrer.replace(/^[^:]+:\/\/[^/]+/, '').replace(/#.*/, '').replace(/\?.*/, '');
    var rNickName = '';
    if (self.pageList[referrerChg]) {
        rNickName = self.pageList[referrerChg] + '->';
    }
    return rNickName;
},
_findKey: function(arr, urlObj) {
    var self = this;

    var ref2=urlObj.referrer.replace(/^[^:]+:\/\/[^/]+/, '').replace(/#.*/, '').replace(/\?.*/, '');
    for (var i = 0, len = arr.length; i < len; i++) {
        var ref1=arr[i].referrer.replace(/^[^:]+:\/\/[^/]+/, '').replace(/#.*/, '').replace(/\?.*/, '');
        if (arr[i].path_name == urlObj.path_name && ref1==ref2) {
            var tempVal1=self.pageListRecord[self.pageListRecord.length-1].clickName.replace(/\[\d+\]/, ''),
                tempVal2=arr[i].clickName.replace(/\[\d+\]/, '');
            if(tempVal1==tempVal2){
                return i + 1;
            }
        }
    }
    return false;
},
saveClickInfo: function(page, keyIndex){
    var self=this;

    var nodes = page.evaluate(getDomTree);
    var tempObj=self.pageEventArr[keyIndex-1];
    var rNickName = self._referrerNickName(tempObj.referrer);
    var fileName=rNickName + tempObj.nickName + self.newClickName.replace(/#/g,'$');
    fs.write(self.root + self.timeNum + "/domTrees/" +fileName+ ".json", JSON.stringify(nodes), {'mode': 'w', 'charset': 'utf8'});
    fs.write(self.root + self.timeNum + "/eventList/" +fileName+ ".json", JSON.stringify(tempObj.page_event), {'mode': 'w', 'charset': 'utf8'});
    page.render(self.root + self.timeNum + "/imgs/" +fileName+ ".jpg");
},
//保存页面信息
saveNewPageInfo: function(page){
    var self=this;

    var tempVal = page.evaluate(self._newFun);

    if(tempVal && tempVal.path_name && tempVal.page_url){
        self.pageEventArr.push({
            path_name: tempVal.path_name,
            page_url: tempVal.page_url,
            nickName: tempVal.nickName,
            referrer: tempVal.referrer,
            page_event: tempVal.page_event,
            cur_num: tempVal.cur_num,
            all_num: tempVal.all_num,
            clickName: self.newClickName
        });
        
        self.pageList[tempVal.path_name] = tempVal.nickName;
        var nodes = page.evaluate(getDomTree);
        var rNickName = self._referrerNickName(tempVal.referrer);
        var fileName=rNickName + tempVal.nickName + self.newClickName.replace(/#/g,'$');
        fs.write(self.root + self.timeNum + "/domTrees/" +fileName+ ".json", JSON.stringify(nodes), {'mode': 'w', 'charset': 'utf8'});
        fs.write(self.root + self.timeNum + "/eventList/" +fileName+ ".json", JSON.stringify(tempVal.page_event), {'mode': 'w', 'charset': 'utf8'});
        page.render(self.root + self.timeNum + "/imgs/" +fileName+ ".jpg");
        if(tempVal.newClickName){
            self.newClickName=tempVal.newClickName;
        }
        if (tempVal.isJump) {
            page.evaluate(self._goBack);
        }

        return tempVal.page_url;
    }else{
        console.log('{M-WARN}错过了一个页面哦！');
        return '';
    }
},
_callbackFun: function(page, url, firstPage) {
    var self = this;
    // page.includeJs('http://apps.bdimg.com/libs/zepto/1.1.4/zepto.min.js', function() {
    var now_page_url, clear;
    var tempTimer=window.setInterval(function(){
        if(self.bigSign){
            clearInterval(tempTimer);
            now_page_url= self.saveNewPageInfo(page);
            self.bigSign=0;
            self.smallSign=1;
            self.startSign=1;
        }
    }, 100);

    var nowTime, curTime, timer1;
    timer1 = window.setInterval(function() {
        if(self.startSign){
            if(self.bigSign){
                self.bigSign=0;
                self.smallSign=0;
                curTime=nowTime=new Date().getTime();
                var urlObj = page.evaluate(self._pageUrl);
                if (urlObj.page_url != now_page_url){
                    var keyIndex = self._findKey(self.pageEventArr, urlObj);
                    if (keyIndex){
                        var opType=self._operateType();
                        if(opType==1){
                            if(page.evaluate(self._goBackFun)){
                                page.evaluate(self._goBack);
                            }
                        }else if(opType==2){
                            var tempInfo = '{old page}再次进入[' + urlObj.nickName + ']页面';
                            console.log(tempInfo);
                            var cur_num = self.pageEventArr[keyIndex - 1].cur_num,
                                all_num = self.pageEventArr[keyIndex - 1].all_num;
                            if (cur_num < all_num) {
                                page.evaluate(self._triggerFun, self.pageEventArr[keyIndex - 1].page_event[cur_num]);
                                var tempTarget=self.pageEventArr[keyIndex - 1].page_event[cur_num];
                                self.newClickName='[' + tempTarget.e_type + '][' + tempTarget.e_target + '][' + tempTarget.e_num + ']';
                                self.pageEventArr[keyIndex - 1].cur_num += 1;
                            } else {
                                var sign = page.evaluate(self._back, firstPage);
                                if (sign) {
                                    window.clearInterval(timer1);
                                    system.stdout.write('successEnd');
                                    phantom.exit(1);
                                } else {
                                    page.evaluate(self._goBack);
                                }
                            }
                        }else{
                            console.log('{M-ERROR}出现了未预料的情况！');
                        }
                    } else {
                        self.saveNewPageInfo(page);
                    }
                    now_page_url = urlObj.page_url;
                } else {
                    var keyIndex = self._findKey(self.pageEventArr, urlObj);
                    var cur_num = self.pageEventArr[keyIndex - 1].cur_num,
                        all_num = self.pageEventArr[keyIndex - 1].all_num;
                    // self.saveClickInfo(page, keyIndex); //先保存
                    if (cur_num < all_num) {
                        page.evaluate(self._triggerFun, self.pageEventArr[keyIndex - 1].page_event[cur_num]);
                        var tempTarget=self.pageEventArr[keyIndex - 1].page_event[cur_num];
                        self.newClickName='[' + tempTarget.e_type + '][' + tempTarget.e_target + '][' + tempTarget.e_num + ']';
                        self.pageEventArr[keyIndex - 1].cur_num += 1;
                    } else {
                        var sign = page.evaluate(self._back, firstPage);
                        if (sign) {
                            window.clearInterval(timer1);
                            system.stdout.write('successEnd');
                            phantom.exit(1);
                        } else {
                            page.evaluate(self._goBack);
                        }
                    }
                }
                curTime=nowTime=new Date().getTime();
                self.smallSign=1;
            }
            curTime=new Date().getTime();
            if(curTime-nowTime>=self.clickWaitTime && self.smallSign){
                nowTime=curTime=new Date().getTime();
                self.bigSign=1;
            }
        }else{
            nowTime=new Date().getTime();
            curTime=new Date().getTime();
        }
    }, 200);
    // });
},
_triggerFun: function(target) {
    var self = this;

    var nickName = window.mPageName,
        page_name = window.location.pathname;
    var tempInfo = '{operation}[' + (nickName || page_name) + ']页面的一次点击操作[' + target.e_type + '][' + target.e_target + '][' + target.e_num + ']';
    console.log(tempInfo);
    $($(target.e_target)[target.e_num]).trigger(target.e_type);
},
_back: function(firstPage) {
    var self = this;

    var nickName = window.mPageName,
        page_name = window.location.pathname,
        page_url = window.location.href;
    if (page_url != firstPage) {
        var tempInfo = '{go back}[' + (nickName || page_name) + ']页面没有可操作元素,返回上一页面';
        console.log(tempInfo);
        return false;
    } else {
        var tempInfo = '{success}';
        console.log(tempInfo);
        return true;
    }
},
_goBack: function() {
    window.history.go(-1);
},
_goBackFun: function() {
    var nickName=window.mPageName || 'promotionPg';
    var tempInfo = '{go back}[' + nickName + ']页面是测试过的,返回上一页面';
    console.log(tempInfo);
    return true;
},
_sortEventList: function(eventArr){
    var self=this;


    return eventArr;
},
_newFun: function() {
    var self = this;

    // 进入页面的初始化操作
    $('.activity-close').trigger('click');  //关闭运营弹窗
    $('.mod-dialog-frame').hide();  //toast隐藏


    // 遍历收集可点击元素
    var usedEvent = [];
    var eventArr = window.eventArr || [];
    for (var i = 0; i < eventArr.length; i++) {
        var hasDomName = '';
        if (eventArr[i].e_parent == '#') {
            if (typeof eventArr[i].e_target == 'string') {
                hasDomName = eventArr[i].e_target;
            } else if (typeof eventArr[i].e_target == 'object' && $($(eventArr[i].e_target)[0]).length) {
                var allName = '';
                var tagName = $(eventArr[i].e_target)[0].tagName.toLowerCase();
                var idName = $(eventArr[i].e_target)[0].getAttribute('id');
                if (!idName) {
                    var className = $(eventArr[i].e_target)[0].getAttribute('class');
                    if (className) {
                        allName = tagName;
                        var classArr = className.split(' ');
                        for (var k = 0, len = classArr.length; k < len; k++) {
                            if ($.trim(classArr[k])) {
                                allName += "." + $.trim(classArr[k]);
                            }
                        }
                    } else {
                        allName = tagName;
                    }
                } else {
                    allName = tagName + "#" + idName;
                }
                hasDomName = allName;
            }
        } else {
            var targetStr = '',
                parentStr = '';
            if (typeof eventArr[i].e_target == 'object') {
                if ($($(eventArr[i].e_target)[0]).length) {
                    var allName = '';
                    var tagName = $(eventArr[i].e_target)[0].tagName.toLowerCase();
                    var idName = $(eventArr[i].e_target)[0].getAttribute('id');
                    if (!idName) {
                        var className = $(eventArr[i].e_target)[0].getAttribute('class');
                        if (className) {
                            allName = tagName;
                            var classArr = className.split(' ');
                            for (var k = 0, len = classArr.length; k < len; k++) {
                                if ($.trim(classArr[k])) {
                                    allName += "." + $.trim(classArr[k]);
                                }
                            }
                        } else {
                            allName = tagName;
                        }
                    } else {
                        allName = tagName + "#" + idName;
                    }
                    targetStr = allName;
                }
            } else {
                targetStr = eventArr[i].e_target;
            }
            if (typeof eventArr[i].e_parent == 'object') {
                if ($($(eventArr[i].e_parent)[0]).length) {
                    var allName = '';
                    var tagName = $(eventArr[i].e_parent)[0].tagName.toLowerCase();
                    var idName = $(eventArr[i].e_parent)[0].getAttribute('id');
                    if (!idName) {
                        var className = $(eventArr[i].e_parent)[0].getAttribute('class');
                        if (className) {
                            allName = tagName;
                            var classArr = className.split(' ');
                            for (var k = 0, len = classArr.length; k < len; k++) {
                                if ($.trim(classArr[k])) {
                                    allName += "." + $.trim(classArr[k]);
                                }
                            }
                        }
                    } else {
                        allName = tagName + "#" + idName;
                    }
                    parentStr = allName;
                }
            } else {
                parentStr = eventArr[i].e_parent;
            }
            hasDomName = parentStr + ' ' + targetStr;
        }
        //有值且元素存在，而且不是返回按钮
        if (hasDomName && $(hasDomName).length && hasDomName != 'i.back-icon') {
            //特殊处理元素   lvyou-header-banner特殊处理
            if (hasDomName.indexOf('.lvyou-header-banner') != -1) {
                for (var a = 0; a < $(hasDomName).length; a++) {
                    usedEvent.push({
                        e_type: eventArr[i].e_type,
                        e_target: hasDomName,
                        e_num: a,
                        e_priority: i
                    });
                }
            } else {
                usedEvent.push({
                    e_type: eventArr[i].e_type,
                    e_target: hasDomName,
                    e_num: 0,
                    e_priority: i
                });
            }
        }
    }
    var cur_num = 0,
        isJump,
        nickName = window.mPageName || ('promotionPg('+ window.location.pathname.replace(/\//g, "-").replace(/(^-*)|(-*$)/g, '')+')'),
        referrer = document.referrer,
        path_name = window.location.pathname,
        page_url = window.location.href;

    var newClickName='';
    var tempInfo = '{new page}进入[' + (nickName || page_url) + ']页面';
    console.log(tempInfo);
    if (usedEvent.length) {
        tempInfo = '{operation}[' + (nickName || page_url) + ']页面的第一次点击操作[' + usedEvent[0].e_type + '][' + usedEvent[0].e_target + '][0]';
        console.log(tempInfo);
        newClickName='[' + usedEvent[0].e_type + '][' + usedEvent[0].e_target + '][0]';
        $($(usedEvent[0].e_target)[0]).trigger(usedEvent[0].e_type);
        cur_num = 1;
        isJump = false;
    } else {
        tempInfo = '{go back}[' + (nickName || page_url) + ']页面没有可操作元素,返回上一页面';
        console.log(tempInfo);
        isJump = true;
    }

    return {
        referrer: referrer,
        nickName: nickName,
        page_url: page_url,
        path_name: path_name,
        page_event: usedEvent,
        all_num: usedEvent.length,
        cur_num: cur_num,
        isJump: isJump,
        newClickName: newClickName
    };
},
autoWalk: function() {
    var self = this;

    self._create(self.firstUrl, function(page, url) {
        self._callbackFun(page, url, self.firstUrl);
    });
}
};



module.exports = Automation;




