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
  var last = i.substr(-1);
  if (last == '#') r.type = 'sub';
  else if (last == '/') r.type = 'filter';
  else r.type = 'address';
  r.re = makeRegExp(i);
  dp.routes[i] = r;
  dp.routes[i].val = val;
}

DirectoryProvider = function (opt) {

  this.delegate = opt.delegate || this;

  var dp = this;
  dp.name = opt.name || 'unnamed ' + (++cnt);

  dp.routes = {};
  for (var i in opt.routes) addRoute(dp,i,opt.routes[i]);

  dp.fn = {};
  var me = this;
  methods.forEach(function(n){
    var sub = n =='list' ? 'filter' : 'address'
    var fn = dp.fn[n] = opt[n] || me.delegate[n] || function() { debug('no '+n,arr(arguments)); };
    dp[n] = function(userId,path) {
      var res = dp.resolve(userId,path,sub);
      if (!res) throw new Meteor.Error(401);

      var args = arr(arguments).slice(2);
      args = [userId,res[1]].concat(args);
      console.log(args);
      var that = res[0];
      return that.fn[n].apply(that.delegate,args);
    };
  })
}

DirectoryProvider.create = function(opt) {
  var dp = new DirectoryProvider(opt);
  return dp;
};

DirectoryProvider.prototype = {
  resolve: function(userId,path,sub) {
    // path = URL.resolve(path);
    if (!sub) sub = path.substr(-1) == '/' ? 'filter' : 'address';
    var found = false;
    for (var i in this.routes) {
      var r = this.routes[i];
      if (r.type!='sub' && r.type !=sub) continue;
      var m = path.match(r.re);
      if (m) { found = r; break; }
    }
    if (!found) return false;
    if (found.type == 'sub') return found.val.resolve(userId,path.substr(i.length-2),sub);
    var args = m.slice(1);
    if (found.val === true) return [this,args];
    return [this,found.val.apply(this.delegate,args)]
  },
  add: function(p,opt) {
    var dp = DirectoryProvider.create(opt);
    addRoute(this,p,dp);
    return dp;
  }
}
