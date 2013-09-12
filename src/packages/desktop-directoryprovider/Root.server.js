Root = DirectoryProvider.create({
  name: 'root',
  routes: {
    '/': true,
  },
  list: function() {
    var ret = Object.keys(this.routes)
    .map(function(n) {
      return { 
        title: n.replace(/^\/|\/[#*]$/g,''), 
        type: 'dir'
      }
    })
    .filter(function(n) {
      return !!n.title;
    });
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
 
