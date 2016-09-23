var express = require('express');
var router = express.Router();
var fs = require("fs");
var spawn = require("child_process").spawn;
var path = require('path');
var paths = path.join(__dirname, '..', 'phantomjs', 'cli.js');


/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: '首页' });
});
router.get('/index', function(req, res, next) {
    res.render('index', { title: '首页' });
});


module.exports = router;


//http://www.cnblogs.com/_franky/archive/2011/11/21/2257381.html
//http://www.cnblogs.com/_franky/archive/2011/11/07/2238980.html


