var webpage = require('webpage');
var page = webpage.create();
page.settings.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4';
var url1="http://lvyou.baidu.com/static/foreign/page/ticket/nuoindex/index.html?ext_from=nuomi&order_from=nuomi&accur_thirdpar=nuomi_hot_recommendation&sid=795ac511463263cf7ae3def3&sname=%E5%8C%97%E4%BA%AC&td_id=16172&td_from=base&is_base=0&pn=1&lastpageName=channelPg&currModule=channel_hot-recommentBk&pageSelectCity=&innerfr=&fr=";
var url2="http://www.baidu.com";
page.open(url1, function(status) {
	if (status === 'success') {
	    window.setTimeout(function(){
	    	page.render('1.jpg');
	    	phantom.exit();
	    },5000);
	} else {
		console.log('error');
	}
});
