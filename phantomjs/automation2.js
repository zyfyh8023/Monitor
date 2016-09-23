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
    //page setting
    page: {},
    //页面可点击元素
    pageEventArr: [],
    //
    timer1: {},
    //初始化
    _init: function(config) {
        var self = this;

        //初始化参数-auto
        self.page = webpage.create();  
        self.firstUrl = config.firstUrl || '';  //站点的首地址
        self.root=config.root || '';   //测试代码图片文件的根目录
        self.timeNum=config.timeNum || '2016';  //测试代码的时间
        self.info=config.info || '';    //测试代码的补充说明信息
        self.waitTime=config.waitTime || 4000;   //打开页面之后的等待时间
        //初始化数据-diff

        //page config
        self.page.settings.userAgent = config.userAgent || 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4';
        self.page.viewportSize = {
            width: config.width || 414,
            height: config.height || 736
        };
        //console.log的信息输出
        self.page.onConsoleMessage = function(msg, lineNum, sourceId) {
            console.log(msg);
        };
        //错误输出
        self.page.onError = function(msg, trace) {
            var msgStack = ['ERROR: ' + msg];
            if (trace && trace.length) {
                msgStack.push('TRACE:');
                trace.forEach(function(t) {
                    msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function+'")' : ''));
                });
            }
            console.log(msgStack.join('\n'));
        };
    },
    _create: function(url, onload) {
        var self = this;

        self.page.open(url, function(status) {
            if (status === 'success') {
                onload && onload(self.page, url);
            } else {
                var Timer=window.setTimeout(function(){
                    clearTimeout(Timer);
                    self._create(url, onload);
                    console.log('新页面打开失败 '+url);
                },1500);
            }
        });
    },
    _pageUrl: function() {
        var self = this;

        return {
            'jumpUrl': window.location.href,
            'matchUrl': window.mPageName
        };
    },
    _callbackFun: function(page, url, firstPage) {
        var self = this;

        page.includeJs('http://apps.bdimg.com/libs/zepto/1.1.4/zepto.min.js', function() {
            window.setTimeout(function() {
                var tempVal = page.evaluate(self._newFun);
                    self.pageEventArr.push({
                        page_name: tempVal.page_name,
                        page_event: tempVal.page_event,
                        cur_num: tempVal.cur_num,
                        all_num: tempVal.all_num
                    });
                    var nodes = page.evaluate(getDomTree);
                    fs.write(self.root+self.timeNum+"/domTrees/"+tempVal.page_name + ".json", JSON.stringify(nodes), 'w');
                    page.render(self.root+self.timeNum+"/imgs/"+tempVal.page_name + ".jpg");
                if(tempVal.isJump){
                   page.evaluate(self._goBack);
                }

                var page_url = url;
                self.timer1 = window.setInterval(function() {
                    var urlObj = page.evaluate(self._pageUrl);
                    if (urlObj.jumpUrl != page_url) {
                        var keyIndex = self._findKey(urlObj.matchUrl, self.pageEventArr);
                        if (keyIndex) {
                            console.log('又一次进入了该('+urlObj.matchUrl+')页面');
                            var cur_num = self.pageEventArr[keyIndex - 1].cur_num,
                                all_num = self.pageEventArr[keyIndex - 1].all_num;
                            if (cur_num < all_num - 1) {
                                self.pageEventArr[keyIndex - 1].cur_num += 1;
                                page.evaluate(self._triggerFun, self.pageEventArr[keyIndex - 1].page_event[cur_num + 1]);
                            } else {
                                var sign = page.evaluate(self._back, firstPage);
                                if (sign){
                                    system.stdout.write('successEnd');
                                    fs.write(self.root + "log.txt", self.timeNum+"\t"+self.info+"\n", {mode: 'w+', charset:'utf8'});
                                    window.clearInterval(self.timer1);
                                    phantom.exit(1);
                                }else{
                                    page.evaluate(self._goBack);
                                }
                            }
                        } else {
                            // window.clearInterval(self.timer1);
                            // self._create(urlObj.jumpUrl, function(page2, url2) {
                            //     self._callbackFun(page2, url2, firstPage);
                            // });
                            var tempVal2 = page.evaluate(self._newFun);
                            self.pageEventArr.push({
                                page_name: tempVal2.page_name,
                                page_event: tempVal2.page_event,
                                cur_num: tempVal2.cur_num,
                                all_num: tempVal2.all_num
                            });
                            var nodes2 = page.evaluate(getDomTree);
                            fs.write(self.root+self.timeNum+"/domTrees/"+tempVal2.page_name + ".json", JSON.stringify(nodes2), {mode: 'w', charset:'utf8'});
                            page.render(self.root+self.timeNum+"/imgs/"+tempVal2.page_name + ".jpg");
                            if(tempVal2.isJump){
                               page.evaluate(self._goBack);
                            }
                            self.waitTime+=300;
                        }
                        page_url = urlObj.jumpUrl;
                    } else {
                        var keyIndex = self._findKey(urlObj.matchUrl, self.pageEventArr);
                        var cur_num = self.pageEventArr[keyIndex - 1].cur_num,
                            all_num = self.pageEventArr[keyIndex - 1].all_num;
                        if (cur_num < all_num - 1) {
                            self.pageEventArr[keyIndex - 1].cur_num += 1;
                            page.evaluate(self._triggerFun, self.pageEventArr[keyIndex - 1].page_event[cur_num + 1]);
                        } else {
                            var sign = page.evaluate(self._back, firstPage);
                            if (sign){
                                system.stdout.write('successEnd');
                                fs.write(self.root + "log.txt", self.timeNum+"\t"+self.info+"\n", {mode: 'w+', charset:'utf8'});
                                window.clearInterval(self.timer1);
                                phantom.exit(1);
                            }else{
                                page.evaluate(self._goBack);
                            }
                        }
                    }
                }, self.waitTime);
            }, self.waitTime);
        });
    },
    _findKey: function(key, arr) {
        var self = this;

        for (var i = 0, len = arr.length; i < len; i++) {
            if (arr[i].page_name == key) {
                return i + 1;
            }
        }
        return false;
    },
    _triggerFun: function(target) {
        var self = this;

        console.log('页面('+ window.mPageName +')执行操作：'+target.e_target + '---' + target.e_type + '---' + target.e_num);
        $($(target.e_target)[target.e_num]).trigger(target.e_type);
    },
    _back: function(firstPage) {
        var self = this;

        if (window.mPageName != firstPage) {
            console.log('本页面('+ window.mPageName +')没有可操作的元素，返回上一页');
            return false;
        } else {
            console.log('测试完成');
            return true;
        }
    },
    _goBack: function(){
        window.history.go(-1);
    },
    _newFun: function() {
        var self = this;

        //关闭弹窗
        $('.activity-close').trigger('click');
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
                //lvyou-header-banner特殊处理
                if (hasDomName.indexOf('.lvyou-header-banner') != -1) {
                    for (var a = 0; a < $(hasDomName).length; a++) {
                        usedEvent.push({
                            e_type: eventArr[i].e_type,
                            e_target: hasDomName,
                            e_num: a
                        });
                    }
                } else {
                    usedEvent.push({
                        e_type: eventArr[i].e_type,
                        e_target: hasDomName,
                        e_num: 0
                    });
                }
            }
        }
        var cur_num = 0, isJump,
            page_name = window.mPageName || new Date().getTime().toString();

        console.log('新页面打开成功 '+page_name);
        if (usedEvent.length) {
            console.log('进入该页面('+ page_name +')的第一次操作：'+usedEvent[0].e_target + '---' + usedEvent[0].e_type + '---' + 0);
            $($(usedEvent[0].e_target)[0]).trigger(usedEvent[0].e_type);
            cur_num = 1;
            isJump=false;
        } else {
            console.log('该新页面('+ page_name +')没有可操作的元素,返回上一页面');
            isJump=true;
        }

        return {
            page_event: usedEvent,
            page_name: page_name,
            cur_num: cur_num,
            all_num: usedEvent.length,
            isJump: isJump
        };
    },
    autoWalk: function() {
        var self = this;


        self._create(self.firstUrl, function(page, url) {
            var firstPageObj = page.evaluate(self._pageUrl);
            var firstPage = firstPageObj.matchUrl;
            self._callbackFun(page, url, firstPage);
        });
    }

};



module.exports = Automation;

