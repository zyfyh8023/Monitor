var fs = require('fs');
var system = require('system');
var _ = require('./util.js');
var createPage = require('./createPage.js');
var getDomTree = require('./getDomTree.js');
var diffDomTree = require('./diffDomTree.js');


var semiAutomation = function(config) {
    this._init(config);
}

semiAutomation.prototype = {
    //配置
    config: {},
    //标识
    isCompleted: false,
    //初始化
    _init: function(config) {
        var self = this;

        self.config.rootPath = config.root;
        if (config.webSite) {
            self.config.webSite = config.webSite;
            self.config.time = new Date();
            self.config.picName = 'capture.jpg';
            self.config.fileName = 'domTree.json';
            self.config.harName = 'harName.json';
            self.config.configName = "config.json";
            self.config.logName = "log.txt";
            self.config.tampFile = 'tempFile.json';
            self.config.root = self.config.rootPath + "/public/DataResults/semiAutomation/";
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
            system.stdout.write('successEnd');
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
            }, 4000);
        });
    },

    //diff dom tree
    diffDomTree: function(index1, index2, key, diffDomTreeRes) {
        var self = this;

        var errArr = [];
        var pages = self.config.pageConfig.pages;
        if (!key) {
            key = 0;
        } else if (key == pages.length) {
            var path = self.config.root + self.config.webSite + "/" + self.config.tampFile;
            fs.write(path, JSON.stringify(diffDomTreeRes), 'w');
            system.stdout.write('successEnd');
            phantom.exit();
        }
        self._getPageDomTree(pages[key].name, index1, function(leftData) {
            if (leftData) {
                self._getPageDomTree(pages[key].name, index2, function(rigthData) {
                    if (rigthData) {
                        var result = diffDomTree(JSON.parse(leftData), JSON.parse(rigthData));
                        var index1Img = self._getImg(index1, pages[key].name);
                        var index2Img = self._getImg(index2, pages[key].name);
                        var allRes = {
                            pageName: pages[key].name,
                            diff: result,
                            err: errArr,
                            index1Img: index1Img,
                            index2Img: index2Img
                        }
                        diffDomTreeRes.push(allRes);
                        self.diffDomTree(index1, index2, key + 1, diffDomTreeRes);
                    } else {
                        var errInfo = {
                            index: index2,
                            pageName: pages[key]
                        };
                        errArr.push(errInfo);
                    }
                })
            } else {
                var errInfo = {
                    index: index1,
                    pageName: pages[key]
                };
                errArr.push(errInfo);
            }
        });
    },

    //get img
    _getImg: function(index, pageName) {
        var self = this;

        var arr = self._getAllList();
        var key = 0;
        if (index == '#') {
            key = arr.length - 1;
        } else {
            key = index;
        }
        var folder = arr[key];
        var path = './DataResults/semiAutomation/' + self.config.webSite + "/" + pageName + "/" + folder + "/" + self.config.picName;
        return path;
    },

    //get Page Dom Tree
    _getPageDomTree: function(pageName, index, callback) {
        var self = this;

        self._getFolDerName(index, function(version) {
            var contents;
            var path = self.config.root + self.config.webSite + "/" + pageName + "/" + version + "/" + self.config.fileName;
            if (fs.isFile(path)) {
                contents = fs.read(path);
            } else {
                console.log('not a file path');
            }
            callback && callback(contents);
        });
    },

    //get index data
    _getFolDerName: function(index, callback) {
        var self = this;

        var version;
        if (index == "#" && !self.isCompleted) {
            var end = self.getData(0, function() {
                self.isCompleted = true;
                var arr = self._getAllList();
                version = arr[arr.length - 1];
                callback && callback(version);
            });
        } else if (index == "#" && self.isCompleted) {
            var arr = self._getAllList();
            version = arr[arr.length - 1];
            callback && callback(version);
        } else {
            var arr = self._getAllList();
            version = arr[index];
            callback && callback(version);
        }
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

module.exports = semiAutomation;



