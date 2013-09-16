DocList = (function() {
  var lists = {};
  var State = new Meteor.Collection(null);
  var fn = function fn(lid,opt) {
    if (!opt) return lists[lid];
    else fn.create(lid,opt);
  }
  var proto = {
    lists: lists,
    create: function(lid,types) {
      var Store = new Meteor.Collection(null);
      if (!lid) lid = Meteor.uuid();
      if (State.findOne(lid)) throw 'doclist already exists';
      State.insert({_id:lid,cwd:'/',selected:null,type:types && types[0] || 'all'});
      var list = lists[lid] = {
        lid: lid,
        cwd: '/',
        cd: function(path,cb) {
          if (path == '..') path = this.cwd.split('/').slice(0,-2).join('/');
          else if (path == '.') path = this.cwd;
          else if (path[0]!='/') path = this.cwd + path;
          if (path.slice(-1)!='/') path = path+'/';
          this.select(null);
          Store.remove({});
          var me = this;
          Root.list(path, function(err,res) {
            if (err) return console.log(err), cb && cb(err);
            me.set('cwd',path);
            me.cwd = path;
            res.forEach(function(n) {
              Store.insert(n);
            })
            cb && cb(null,'OK');
          })
          return this;
        },
        select: function(p,t) {
          var me = this;
          if (!p) {
            var q = Store.findOne({title:t});
            if (!q) {
              this.set({
                'selected': me.cwd + t,
                'title': t,
                'selectedIsDir': t && t.substr(-1) == '/',
                'selectedIsDoc': t && t.substr(-1) != '/'
              })
              return;
            }
            p = q.path;
          } 
          this.set({
            'selected': p,
            'title': p ? p.split('/').filter(Boolean).pop() : '',
            'selectedIsDir': p && p.substr(-1) == '/',
            'selectedIsDoc': p && p.substr(-1) != '/'
          });
          return this;
        },
        set: function(a1,a2) {
          if (arguments.length>1) c ={}, c[a1] = a2;
          else c = a1;
          State.update(lid,{$set:c});
          return this;
        },
        get state () {
          return State.findOne(lid);
        },
        destroy: function() {
          State.remove(lid);
          Store.remove({});
          delete lists[lid];
        },
        find: Store.find.bind(Store),
        findOne: Store.findOne.bind(Store),
      };
      list.setLater = _.debounce(list.set.bind(list),200);
      list.selectLater = _.debounce(list.select.bind(list),200);
      return list;
    }
  }
  for (var i in proto) fn[i] = proto[i];
  return fn;
})();

