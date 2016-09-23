$(function(){ 
	  
	// var socket = io.connect('http://cq01-rdqa-dev025.cq01:8086');       
	var socket = io.connect('http://localhost:8086');
	
	socket.on('autoStartSuc', function (data) {     
		$('.J_submit').removeAttr('disabled'); 
		$('.J_msgBody').append('<div style="color:blue;">'+data+'</div>');
		var tempScrollTop=$(".J_msgBody")[0].scrollTop,
			tempScrollHeight=$(".J_msgBody")[0].scrollHeight;
		if((tempScrollTop+100)>=(tempScrollHeight-400) || tempScrollHeight==400){
			$(".J_msgBody")[0].scrollTop = $(".J_msgBody")[0].scrollHeight;
		}
  	});  
    socket.on('autoStartMsg', function (data) {     
    	if(typeof data == 'object'){
    		$('.J_msgBody').append('<div>'+JSON.stringify(data)+'</div>');
    	}else{
    		$('.J_msgBody').append('<div>'+data+'</div>');
    	}
    	var tempScrollTop=$(".J_msgBody")[0].scrollTop,
			tempScrollHeight=$(".J_msgBody")[0].scrollHeight;
		if((tempScrollTop+100)>=(tempScrollHeight-400)  || tempScrollHeight==400){
			$(".J_msgBody")[0].scrollTop = $(".J_msgBody")[0].scrollHeight;
		}
  	});  
  	socket.on('autoStartMsgMR', function (data) { 
  		if(typeof data == 'object'){
    		$('.J_msgBody').append('<div style="color:gray;">'+JSON.stringify(data)+'</div>');
    	}else{
    		$('.J_msgBody').append('<div style="color:gray;">'+data+'</div>');
    	}     
    	var tempScrollTop=$(".J_msgBody")[0].scrollTop,
			tempScrollHeight=$(".J_msgBody")[0].scrollHeight;
		if((tempScrollTop+100)>=(tempScrollHeight-400)  || tempScrollHeight==400){
			$(".J_msgBody")[0].scrollTop = $(".J_msgBody")[0].scrollHeight;
		}
  	});
  	socket.on('autoStartErr', function (data) { 
  		if(typeof data == 'object'){
    		$('.J_msgBody').append('<div style="color:red;">'+JSON.stringify(data)+'</div>');
    	}else{
    		$('.J_msgBody').append('<div style="color:red;">'+data+'</div>');
    	}     
    	var tempScrollTop=$(".J_msgBody")[0].scrollTop,
			tempScrollHeight=$(".J_msgBody")[0].scrollHeight;
		if((tempScrollTop+100)>=(tempScrollHeight-400)  || tempScrollHeight==400){
			$(".J_msgBody")[0].scrollTop = $(".J_msgBody")[0].scrollHeight;
		}
  	}); 

	$('.J_comConfig').on('click', '.J_website', function(){
		$(".dropdown-toggle").html($(this).text()+'<span class="caret"></span>');
		$(".dropdown-toggle").val($(this).text());
	});
	
	$('.J_comConfig').on('click', '.J_submit', function(){
		var info=$('.J_info').val(),
			dropdown=$(".dropdown-toggle").val();
		if(dropdown && info){
			$(this).attr('disabled', 'disabled');
			$('.J_msgPanel').show();
			var startInfo='<div style="color:#fff;">测试一次大约耗时35分钟，请不要刷新页面，耐心等待。。。</div>';
			$('.J_msgBody').html('').append(startInfo);
			socket.emit('autoStart', info, dropdown);
		}else{
			alert('填写完整！');
		}
	})

	
}); 