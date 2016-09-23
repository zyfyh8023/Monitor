var express = require('express');
var router = express.Router();
var fs = require("fs");
var spawn = require("child_process").spawn;
var path = require('path');
var command = path.join(__dirname, '..', 'phantomjs', 'command.js'); //新版的

//站点接入
router.get('/autoIndex', function(req, res, next) {
    res.render('./auto/newProject', { 
        title: '接入站点',
        msg: '接入站点需要输入包括三个部分的内容：第一给要接入的站点起个英文名称；第二输入站点的首地址，即测试的入口地址；第三对该站点进行简要的描述。'
     });
});
//站点接入提交表单
router.post('/autoIndexForm1', function(req, res, next) {
    var websiteName = req.body.websiteName,
        proxyAddress = req.body.proxyAddress,
        firstPage = req.body.firstPage;

    var obj = {
        websiteName: websiteName,
        proxyAddress: proxyAddress,
        firstPage: firstPage
    };
    // 创建 newdir 目录
    if (websiteName && firstPage) {
        fs.mkdir('./public/DataResults/Automation/' + websiteName, function(err1) {
            if (err1) {
                res.json({
                    errno: 1,
                    msg: JSON.stringify(err1)
                });
            } else {
                fs.writeFile('./public/DataResults/Automation/' + websiteName + '/config.json', JSON.stringify(obj), function(err2) {
                    if (err2) {
                        res.json({
                            errno: 2,
                            msg: JSON.stringify(err2)
                        });
                    } else {
                        fs.writeFile('./public/DataResults/Automation/' + websiteName + '/log.txt', '', function(err3) {
                            if (err3) {
                                res.json({
                                    errno: 3,
                                    msg: JSON.stringify(err3)
                                });
                            } else {
                                res.json({ errno: 0 });
                            }
                        });
                    }
                });
            }
        });
    } else {
        res.json({
            errno: 4,
            msg: '填写完整！'
        });
    }

});

//测试记录
router.get('/autoHistory', function(req, res, next) {
    fs.readdir('./public/DataResults/Automation/', function(err1, files) {
        if (err1) {
            res.render('./auto/historyRecords', {
                title: '测试记录',
                errno: 1,
                msg: JSON.stringify(err1)
            });
        } else {
            var allRes = [];
            for (var i = 0; i < files.length; i++) {
                if (!(/^\./.test(files[i]))) {
                    var website = fs.readFileSync('./public/DataResults/Automation/' + files[i] + '/config.json', 'utf-8');
                    website=JSON.parse(website);
                    var contents = fs.readFileSync('./public/DataResults/Automation/' + files[i] + '/log.txt', 'utf-8');
                    var conArr = contents.split('\n');
                    var contantArr = [];
                    for (var j = 0; j < conArr.length; j++) {
                        if (conArr[j]) {
                            var obj = {};
                            var tempVal = conArr[j].split('\t');
                            obj['time'] = tempVal[0];
                            obj['value'] = tempVal[1];
                            contantArr.push(obj);
                        }
                    }

                    allRes.push({
                        name: website.websiteName,
                        firstPage: website.firstPage,
                        infoCon: website.proxyAddress,
                        elems: contantArr
                    });
                }
            }
            console.log(JSON.stringify(allRes));
            res.render('./auto/historyRecords', {
                title: '测试记录',
                errno: 0,
                allRes: allRes,
                msg: '测试记录包括两个功能：第一查看每次的测试结果； 第二选择同一站点任意两次的测试结果进行对比查看差异。'
            });
        }
    });
});

//对比差异
router.get('/twoTimeDetail', function(req, res, next) {
    var website = req.query.website,
        timenum1 = req.query.timenum1,
        timenum2 = req.query.timenum2;
    if (website && timenum1 && timenum2) {
        var child_process = spawn("phantomjs", [command, '-autodiff', website, timenum1, timenum2]);
        child_process.stdin.setEncoding('utf8');
        child_process.stdout.setEncoding('utf8');
        //stdout
        child_process.stdout.on('data', function(data) {
            var resArr = data.match(/successEnd-(.*)/);
            if (resArr && resArr.length > 1) {
                var contents = fs.readFileSync('./public/DataResults/Automation/' + website + '/rubbish/' + resArr[1], 'utf-8');
                var results = JSON.parse(contents);
                var newDivElem = [],
                    oldDivElem = [];
                for (var j = 0; j < results.ins.length; j++) {
                    var oldVal = [],
                        newVal = [];
                    for (var i = 0, len = results.ins[j].diff.length; i < len; i++) {
                        var tempDiv = results.ins[j].diff[i].node.rect[2] + "px;height:" +
                            results.ins[j].diff[i].node.rect[3] + "px;top:" +
                            results.ins[j].diff[i].node.rect[1] + "px;left:" +
                            results.ins[j].diff[i].node.rect[0] + "px;'></div>";

                        if (results.ins[j].diff[i].type == 1) {
                            newVal.push("<div class='add_icon_add' style='width:" + tempDiv);
                        } else if (results.ins[j].diff[i].type == 2) {
                            oldVal.push("<div class='add_icon_rm' style='width:" + tempDiv);
                        } else {
                            newVal.push("<div class='add_icon_sty' style='width:" + tempDiv);
                        }
                    }
                    oldDivElem.push(oldVal);
                    newDivElem.push(newVal);
                }
                res.render('./auto/twoTimeDetail', {
                    title: '两次测试结果差异对比',
                    results: results,
                    newDivElem: newDivElem,
                    oldDivElem: oldDivElem,
                    timenum1: timenum1,
                    timenum2: timenum2
                });
            } else {
                console.log(data);
            }
        });
        //stderr
        child_process.stderr.on('data', function(data) {
            console.log(data);
        });
        //error
        child_process.on('error', function(data) {
            console.log(data);
        });
    }
});

//单次详情
router.get('/oneTimeDetail', function(req, res, next) {
    var website = req.query.website,
        timenum = req.query.timenum;

    if (website && timenum) {
        fs.readdir('./public/DataResults/Automation/' + website + '/' + timenum + '/imgs/', function(err1, files) {
            if (err1) {
                //do something
                res.render('./auto/oneTimeDetail', {
                    title: '本次测试的页面',
                    allRes: []
                });
            } else {
                var allRes = [];
                for (var i = 0; i < files.length; i++) {
                    var tempObj = {};
                    if (/\.jpg$/.test(files[i])) {
                        tempObj.name = files[i];
                        tempObj.imgurl = './DataResults/Automation/' + website + '/' + timenum + '/imgs/' + files[i];
                        allRes.push(tempObj);
                    }
                }
                res.render('./auto/oneTimeDetail', {
                    title: '本次测试的页面',
                    allRes: allRes
                });
            }
        });
    }
});

//新建测试
router.get('/autoCreate', function(req, res, next) {
    fs.readdir('./public/DataResults/Automation/', function(err1, files) {
        if (err1) {
            res.render('./auto/autoCreate', {
                title: '新建测试',
                errno: 1,
                msg: JSON.stringify(err1)
            });
        } else {
            var allRes = [];
            for (var i = 0; i < files.length; i++) {
                if (!(/^\./.test(files[i]))) {
                    allRes.push(files[i]);
                }
            }
            res.render('./auto/autoCreate', { 
                title: '新建测试', 
                allRes: allRes,
                msg: '新建测试需要两个部分的内容：第一选择一个已经接入的站点名称；第二输入本次测试的说明，方便后期查看。'
            });
        }
    });
});


module.exports = router;


