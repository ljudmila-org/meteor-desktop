Root = {};
methods.forEach(function(n) {
  Root[n] = function() {
    var args = arr(arguments);
    var cbs = args.filter(function(n){return typeof n=='function'});
    var args = args.filter(function(n){return typeof n!='function'});
    Meteor.call('desktop-dp-root',n,args,cbs[0]);
  }
});
