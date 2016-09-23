var fs = require('fs');
var _ = require('./util.js');
var createPage = require('./createPage.js');
var getDomTree = require('./getDomTree.js');
var diffDomTree = require('./diffDomTree.js');


var Performance = function(config) {
    this._init(config);
}

Performance.prototype = {
    //配置
    config: {},
    //初始化
    _init: function(config) {
        var self = this;

        if (config.webSite) {
            self.config.webSite = config.webSite;
            self.config.time = new Date();
            self.config.picName = 'capture.jpg';
            self.config.fileName = 'domTree.json';
            self.config.harName = 'harName.json';
            self.config.configName = "config.json";
            self.config.logName = "log.txt";
            self.config.root = "../DataResults/Performance/";
            var pageConfig = require(self.config.root + config.webSite + '/' + self.config.configName);
            self.config.pageConfig = pageConfig;
        } else {
            _.logFun('webSite null');
            phantom.exit(1);
        }
    },

    //phantom create page
    getData: function(index, callback) {
        var self = this;

        if (!index) {
            index = 0;
        } else if (index == self.config.pageConfig.pages.length) {
            fs.write(self.config.root + self.config.webSite + "/" + self.config.logName, self.config.time.getTime() + "\n", 'w+');
            console.log('success over');
            if (callback) {
                callback();
                return;
            } else {
                phantom.exit();
            }
        }
        var host = self.config.pageConfig.host;
        self.config.addressName = self.config.pageConfig.pages[index]['name'],
            self.config.address = self.config.pageConfig.pages[index]['file'];
        var address = host + self.config.address;
        createPage(address, function(page, har) {
            window.setTimeout(function() {
                var nodes = page.evaluate(getDomTree);
                fs.write(self._createDirFile(self.config.fileName), JSON.stringify(nodes), 'w');
                page.render(self._createDirFile(self.config.picName));
                fs.write(self._createDirFile(self.config.harName), JSON.stringify(har), 'w');
                self.getData(index + 1, callback);
            }, 2000);
        });
    },

    //get page HAR file
    getPageHar: function(pageName, index){
        var self=this;

        var hisArr=self._getAllList();
        var path=self.config.root+"/"+self.config.webSite+"/"+pageName+"/"+hisArr[index]+"/"+self.config.harName;
        var contents;
        if(fs.isFile(path)){
            contents=fs.read(path);
        }else{
            console.log('this path is not a HAR file');
            phantom.exit(1);
        }
        console.log(contents);
        return contents; 
    },

    //获取历史版本
    _getAllList: function() {
        var self = this;

        var hisArr = [];
        var path = self.config.root + self.config.webSite + "/" + self.config.logName;
        if (fs.isFile(path)) {
            var contents = fs.read(path);
            var contentsArr = contents.split('\n');
            for (var i = 0, len = contentsArr.length; i < len; i++) {
                if (contentsArr[i]) {
                    hisArr.push(contentsArr[i]);
                }
            }
        } else {
            console.log('warning: no log.txt file');
            phantom.exit(1);
        }

        return hisArr;
    },

   //文件目录
    _createDirFile: function(fileName) {
        var self = this;

        return self.config.root +
            self.config.webSite +
            "/" + self.config.addressName +
            "/" + self.config.time.getTime() +
            "/" + fileName;
    }

}

module.exports = Performance;