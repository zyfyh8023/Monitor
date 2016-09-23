$(function() {
    $('.J_table').on('click', '.J_look', function() {
        var website = $(this).data('website'),
            timenum = $(this).data('timenum');
        if (website && timenum) {
            location.href="/oneTimeDetail?website="+website+"&timenum="+timenum;
        } else {
            alert('参数有误！');
        }
    });

    $('.J_table').on('click', 'input', function(e) {
        e = e || window.event;
        var parent = $(this).closest('table');
        if ($(parent).find('.J_on').length < 2) {
            if ($(this).hasClass('J_on')) {
                $(this).removeClass('J_on');
            } else {
                $(this).addClass('J_on');
            }
        } else if ($(parent).find('.J_on').length == 2) {
            if ($(this).hasClass('J_on')) {
                $(this).removeClass('J_on');
            } else {
                e.preventDefault();
                return false;
            }
        } else {
            e.preventDefault();
            return false;
        }
    });

    $('.panel').on('click', '.J_diff', function(e) {
        var parent=$(this).closest('.panel');
        var lens=$(parent).find('.J_on');
        if($(lens).length==2){
        	var website=$($(lens)[0]).data('website'),
        		timenum1=$($(lens)[0]).data('timenum'),
        		timenum2=$($(lens)[1]).data('timenum');
            location.href="/twoTimeDetail?website="+website+"&timenum1="+timenum1+"&timenum2="+timenum2;
        }else{
        	alert('必须选择两个哦~');
        }
    });

    $('.J_titleBtn').click(function(){
        if($(this).hasClass('on')){
            $(this).removeClass('on').next(".J_moreInof").hide();
        }else{
            $(this).addClass('on').next(".J_moreInof").show();
        }
    });


});