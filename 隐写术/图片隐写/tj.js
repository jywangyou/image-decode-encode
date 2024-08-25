// var mysitedomain=document.domain.split('.').slice(-2).join('.');
// // console.log(mysitedomain);
// if (mysitedomain!='p2hp.com'){
// //alert('please remove www.p2hp.com/tj.js from your site resource code,thank you!');
// }

var thefangwenurl = new URL(window.location);
var hahahaad = thefangwenurl.searchParams.get('ad');
var hahahaad2 = thefangwenurl.searchParams.get('wd');

if (hahahaad) {

  throw new Error(
    'Program Terminated');
}

if (hahahaad2) {

  throw new Error(
    'Program Terminated');
}

// console.log(22222)

var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?922b439c87e8f0454da9a99cbe1e8513";
  var s = document.getElementsByTagName("script")[0]; 
  s.parentNode.insertBefore(hm, s);
})();


(function(){
  var bp = document.createElement('script');
  var curProtocol = window.location.protocol.split(':')[0];
  if (curProtocol === 'https') {
      bp.src = 'https://zz.bdstatic.com/linksubmit/push.js';
  }
  else {
      bp.src = 'http://push.zhanzhang.baidu.com/push.js';
  }
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(bp, s);
})();