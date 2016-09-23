$(function(){ 
	$('.J_comConfig').on('click', '.J_submit', function(){
		var websiteName=$('#websiteName').val(),
			proxyAddress=$('#proxyAddress').val(),
			firstPage=$('#firstPage').val();
		if(websiteName && firstPage){
			if(websiteName.match(/^[A-Za-z0-9]+$/)){
				$.ajax({ 
					url: "/autoIndexForm1", 
					method: 'post',
					data:{
						websiteName: websiteName,
						proxyAddress: proxyAddress,
						firstPage: firstPage
					},
					success: function(data){
						if(!data.errno){
							alert('添加成功！');
						}else{
							alert(data.msg);
						}
					}
				});
			}else{
				alert('站点名称必须由英文数字组成！');
			}
		}else{
			alert('站点名称必填！');
		}
	})

	
}); 