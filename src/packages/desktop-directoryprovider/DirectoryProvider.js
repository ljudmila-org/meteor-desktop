var cnt = 0;
function makeRegExp(path) {
  if (path instanceof RegExp) return path;
  if (path instanceof Array) path = '(' + path.join('|') + ')';
  path = path
    .replace(/\/\(/g, '(?:/')
    .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
      slash = slash || '';
      return ''
        + (optional ? '' : slash)
        + '(?:'
        + (optional ? slash : '')
        + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
        + (optional || '');
    })
    .replace(/([\/.])/g, '\\$1')
    .replace(/\*|#/g, '(.*)');
  return new RegExp('^' + path + '$', '');
}

addRoute = function(dp,i,val) {
  var r = {};
  r.re = makeRegExp(i);
  var last = i.substr(-1);
  if (last == '#') {
    r.type = 'sub';
    if (!(val instanceof DirectoryProvider)) val = DirectoryProvider.create(val);
  } else {
    if (last == '/') r.type = 'filter';
    else r.type = 'address';

    if (!val || val.constructor !== Object) {
      val = {transform:val,methods:dp.fn};
    } else {
      val = {transform:val.transform,methods:val}
    }
  }
  r.val = val;
  dp.routes[i] = r;
}

DirectoryProvider = function (opt) {

  this.delegate = opt.delegate || this;

  var dp = this;
  dp.name = opt.name || 'unnamed ' + (++cnt);

  dp.fn = {};
  var me = this;
  methods.forEach(function(n){
    var sub = n =='list' ? 'filter' : 'address'
    var fn = dp.fn[n] = opt[n] || me.delegate[n] || function() { debug('no '+n,arr(arguments)); };
    dp[n] = function(userId,path) {
      var res = dp.resolve(userId,path,sub);
      if (!res) throw new Meteor.Error(401,'path not found in '+dp.name);

      var args = arr(arguments);

      var that = res[0];
      var methods = res[1];
      args[1] = res[2];
      var fullpath = res[3];
      var res = methods[n].apply(that.delegate,args);
      if (res instanceof Array) {
        for (var i in res) res[i].path = fullpath + res[i].title + (res[i].type=='dir' ? '/' : '');
      } else if (res && res.constructor == Object) {
        res.path = fullpath.split('/').slice(0,-1).concat(res.title).join('/') + (res.type=='dir' ? '/' : '');
      }
      return res;
    };
  })
  dp.routes = {};
  for (var i in opt.routes) addRoute(dp,i,opt.routes[i]);
}

DirectoryProvider.create = function(opt) {
  var dp = new DirectoryProvider(opt);
  return dp;
};

DirectoryProvider.prototype = {
  resolve: function(userId,path,subtype,full) {
    full = full || path;
    debug(this.name,'matching',path);
    // path = URL.resolve(path);
    if (!subtype) subtype = path.substr(-1) == '/' ? 'filter' : 'address';
    var found = false;
    for (var i in this.routes) {
      var r = this.routes[i];
      if (r.type!='sub' && r.type != subtype) continue;
      var m = path.match(r.re);
      debug(i,!!m);
      if (m) { found = r; break; }
    }
    if (!found) return false;
    if (found.type == 'sub') {
      return found.val.resolve(userId,path.substr(i.length-2),subtype,full);
    };

    var t = found.val.transform;
    var methods = found.val.methods;
    switch (typeof t) {
      case 'boolean': return [this, methods, t ? arr(m).slice(1) : path, full];
      case 'function': return [this, methods, t.apply(this.delegate, m.slice(1)),full];
      default: return [this,methods, t,full];
    }
  },
  add: function(p,opt) {
    var dp = DirectoryProvider.create(opt);
    addRoute(this,p,dp);
    return dp;
  }
}
