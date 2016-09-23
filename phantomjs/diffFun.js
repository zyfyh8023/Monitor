//
var fs = require('fs');
var system = require('system');
var diffDomTree = require('./diffDomTree.js');

//DiffFun
function DiffFun(config) {
    this._init(config);
}

DiffFun.prototype = {
    _init: function(config) {
        var self = this;

        self.root = config.root;
        self.website = config.website;
    },
    //get left and right data
    _getLeftAndRightData: function(leftTimeNum, rightTimeNum) {
        var self = this;

        var leftJsonPath = self.root + self.website + '/' + leftTimeNum + '/domTrees/',
            rightJsonPath = self.root + self.website + '/' + rightTimeNum + '/domTrees/';
        var leftJson = fs.list(leftJsonPath),
            rightJson = fs.list(rightJsonPath);
        var results = {
            'left': [],
            'right': []
        };
        for (var i = 0; i < leftJson.length; i++) {
            if (leftJson[i].match(/^[a-zA-Z]/)) {
                var content = fs.read(leftJsonPath + leftJson[i]);
                var tempObj = {
                    'name': leftJson[i],
                    'content': content
                };
                results['left'].push(tempObj);
            }
        }
        for (var i = 0; i < rightJson.length; i++) {
            if (rightJson[i].match(/^[a-zA-Z]/)) {
                var content = fs.read(rightJsonPath + rightJson[i]);
                var tempObj = {
                    'name': rightJson[i],
                    'content': content
                };
                results['right'].push(tempObj);
            }
        }
        return results;
    },
    _getImgUrl: function(TimeNum, pageName) {
        var self = this;

        var pageName2 = pageName.replace(/\.json/, '.jpg');
        return './DataResults/Automation/' + self.website + '/' + TimeNum + '/imgs/' + pageName2; //路径处理
    },
    walkDiffFun: function(leftTimeNum, rightTimeNum) {
        var self = this;

        var allInfo = {
            'ins': [],
            'outs': []
        };
        var results = self._getLeftAndRightData(leftTimeNum, rightTimeNum);
        for (var i = 0; i < results.left.length; i++) {
            var sign = 0;
            for (var j = 0; j < results.right.length; j++) {
                if (results.left[i].name == results.right[j].name) {
                    sign = 1;
                    results.right[j].tempSign = 1;
                    var tempVal = diffDomTree(JSON.parse(results.left[i].content), JSON.parse(results.right[j].content));
                    var allRes = {
                        pageName: results.left[i].name.replace(/\.json/, ''),
                        diff: tempVal,
                        index1Img: self._getImgUrl(leftTimeNum, results.left[i].name),
                        index2Img: self._getImgUrl(rightTimeNum, results.right[j].name)
                    }
                    allInfo['ins'].push(allRes);
                }
            }
            if (!sign) {
                allInfo['outs'].push({
                    pageName: results.left[i].name.replace(/\.json/, ''),
                    groupName: leftTimeNum,
                    Img: self._getImgUrl(leftTimeNum, results.left[i].name)
                });
            }
        }
        for (var k = 0; k < results.right.length; k++) {
            if (results.right[k].tempSign) {
                delete results.right[k].tempSign;
            } else {
                allInfo['outs'].push({
                    pageName: results.right[k].name.replace(/\.json/, ''),
                    groupName: rightTimeNum,
                    Img: self._getImgUrl(rightTimeNum, results.right[k].name)
                });
            }
        }

        var tempFileName = new Date().getTime();
        var path = self.root + self.website + '/rubbish/' + tempFileName + ".json";
        fs.write(path, JSON.stringify(allInfo), 'w');
        system.stdout.write('successEnd-' + tempFileName + ".json");
        phantom.exit();
    }

}

module.exports = DiffFun;