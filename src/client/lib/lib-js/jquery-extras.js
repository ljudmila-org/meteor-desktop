$.fn.fire = function(ev,args,a1,a2) {
  a1 = a1 === undefined ? true : a1;
  a2 = a2 === undefined ? true : a2;
  args = args || {};
  var e = document.createEvent('HTMLEvents');
  e.initEvent(ev,a1,a2);
  for (var i in args) e[i]=args[i];
  
  this.each( function() {
    this.dispatchEvent(e);
  });
}

