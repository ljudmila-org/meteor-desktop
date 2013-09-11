Root = DirectoryProvider.create({
  routes: {
    '/': true,
  },
  list: function() {
    debug(this.routes);
    var ret = Object.keys(this.routes)
    .filter(function(n) { 
      return n.substr(-1)=='#';
     })
    .map(function(n) {
      return { 
        title: n.substring(0,n.length-1), 
        path: n.substring(0,n.length-1), 
        type: 'app/x-meteor-desktop-dp+dir'
      }
    })
    return ret;
  }
});

Meteor.methods({
  'desktop-dp-root': function(name,args) {
    args = arr(args);
    args.unshift(Meteor.userId());
    console.log(name,args);
    if (methods.indexOf(name)<0) throw new Meteor.Error(500);
    return Root[name].apply(Root,args);
  }
});
 
