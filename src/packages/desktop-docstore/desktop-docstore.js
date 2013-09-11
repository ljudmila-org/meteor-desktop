var match = (function() {
  var Matcher = new Meteor.Collection(null);

  return function(doc,pattern) {
    doc._id = Meteor.uuid();
    Matcher.insert(doc);
    var res = !!Matcher.findOne({$and:[ {_id:doc._id}, pattern ]},{ _id:1 });
    Matcher.remove(doc._id);
    return res;
  }
})();

var first = function() {
  for (var i in arguments) if (typeof(arguments[i])!=='undefined') return arguments[i];
  return undefined;
}

/* MD5 HELPER */
var crypto = Npm.require('crypto');
function md5(data) {
  return crypto.createHash('md5').update(data).digest("hex");
}


function options(opt) {
  switch(typeof opt) {
  case 'object': break;
  case 'boolean':
  case 'function':  opt = {read:opt,write:opt}; break;
  case 'undefined':  opt = {read:true,write:true}; break;
  default: 
    throw new Meteor.error('bad option for DocStore');
  }
  if (!opt || opt.constructor != Object) throw new Meteor.Error(500,'bad option for DocStore');
  
  opt = {
    write: opt.write,
    read: opt.read,
    
    create: first(opt.create, opt.write),
    remove: first(opt.remove, opt.create, opt.write),
    change: first(opt.change, opt.write),
    set: first(opt.set, opt.change, opt.write),
    get: first(opt.get, opt.read),
  }
  
  return opt;
}

DocStore = {
  create: function DocStore_create(storeName,aspec,ospec,filter, allow) {

    // setup the collection
    var collectionName = 'pkg_docstore_'+storeName;
    var Store = new Meteor.Collection(collectionName);

    // setup indexes
    Store._ensureIndex({address:1},{unique:1});
    
    function setup_spec_indexes(s) {    
      for (var i in s) {
        if (!s[i]) continue;
        var obj = {}; obj[i] = 1;
        Store._ensureIndex(obj,{unique:0});
      }
    }
    function _fields(keys,f) {
      var ret = {};
      if (Array.isArray(f)) {
        for (var i = 0; i<keys.length && i<f.length; i++) ret[keys[i]] = f[i];
      } else {
        for (var i in keys) if (keys[i] in f) ret[keys[i]] = f[keys[i]];
      }
      return ret;
    }

    // setup address fields
    setup_spec_indexes(aspec);
    var akeys = Object.keys(aspec)
    var afields = _fields.bind(this,akeys);

    function address(f) {
      var af = afields(f);
      var aj = JSON.stringify(af);
      return md5(aj);
    }

    // setup other fields
    setup_spec_indexes(ospec);
    var okeys = Object.keys(ospec); 
    var ofields = _fields.bind(this,okeys);

    // setup filters and allows
    var filter = options(filter);
    var allow = options(allow);    

    var userFilter = function(userId,what) {
      var a = filter[what]; if (typeof a == 'function') a = a(userId);
      if (a === true) return {};
      if (a === false) return {_id:null};
      return a;
    }

    var userMust = function(userId,what,doc) {
      var a = allow[what]; if (typeof a == 'function') a = a(userId,doc);
      if (a === true) return true;
      if (a === false) throw new Meteor.Error(401,'not allowed');
      if (typeof a =='object' || !match(doc,a)) throw new Meteor.Error(401,'not allowed');
      var a = filter[what]; if (typeof a == 'function') a = a(userId);
      if (a === true) return true;
      if (a === false || !match(doc,a)) throw new Meteor.Error(401,'not allowed');
      return true;
    }
    

    var CreatedStore = {
      Store: Store,
      publish: function(name,filter) {
        name = name || collectionName;
        return Meteor.publish(name,function() {
          var f = userFilter(this.userId,'get');
          f = {$and:[f,filter||{}]};
          return Store.find(f, {fields:{address:0}});
        })
      },
      list: function(userId,filter) {
        var f = userFilter(Meteor.userId(),'get');
        f = {$and:[f,filter||{}]};
        return Store.find(f, {fields:{address:0}}).fetch();
      },
      write: function(userId,af,of,content) {
        return docupdate(userId,af,of,content) || docinsert(userId,af,of,content);
      },
      read: function (userId,af) {
        var doc = this.get(userId,af);
        userMust(userId,'read',doc);
        doc.content = ContentStore.read(content_id(doc._id)).content;
        console.log('read content',doc.content);
        return doc;
      },
      stat: function(userId,af) {
        var a = address(af);
        var doc = Store.findOne({address:a});
        if (!doc) return false;
        userMust(userId,'get',doc);
        return doc;
      },
      get: function(userId,af) {
        var doc = this.stat(userId,af);
        if (!doc) throw new Meteor.Error(404);
        return doc;
      },
      set: function(userId,af,afc) {
        var oldaf = afields(af);
        console.log('set old',oldaf);

        //find the doc and check permissions
        var olddoc = this.get(userId,oldaf);
        if (!olddoc) throw ('bad address');
        userMust(userId,'set',olddoc);

        // create the new address and check that it's not taken
        var newaf = _.extend({},oldaf,afields(afc));
        console.log('set new',newaf);

        if (this.stat(userId,newaf)) throw ('duplicate address');

        //create the new doc and check permissions;
        var newdoc = _.extend({},olddoc,newaf);
        console.log('set new doc',newdoc);
        userMust(userId,'create',newdoc);
        
        //store and return
        var changes = _.extend({},newaf,{address:address(newaf)});
        console.log('set changes',changes);
        Store.update({address:olddoc.address},{$set:changes})
        return newdoc;
      },
      remove: function(userId,af) {
        var olddoc = this.get(userId,af);
        userMust(userId,'remove',olddoc);
        Store.remove({address:olddoc.address});
        ContentStore.remove(content_id(olddoc._id));
        return true;
      }
    }
    return CreatedStore;
    
  
    function content_id(_id) {
      return ['docstore',storeName,_id];
    }
    
    function docinsert(userId,af,of,content) {
      var _id = Meteor.uuid();

      var af = afields(af);
      var a = address(af);
      var of = ofields(of);

      var now = Date.now();
      var newdoc = _.extend({},of,af,{
        _id: _id,
        address: a,
        cuser: userId,
        cdate: now,
        muser: userId,
        mdate: now,
      });

      userMust(userId,'create',newdoc);
      userMust(userId,'write',newdoc);
      
      var _content = ContentStore.write(content_id(newdoc._id),content);
      newdoc.size = _content.size;
      newdoc.encoding = _content.content_encoding;
      Store.insert(newdoc);
      newdoc.content = content;
      return newdoc;
    }

    function docupdate(userId,af,of,content) {
      var af = afields(af);
      var a = address(af);
      
      var olddoc = Store.findOne({address:a});
      if (!olddoc) return false;
      userMust(userId,'change',olddoc);
     
      var of = ofields(of);
      var changes = _.extend({},of,{
        muser: userId,
        mdate: Date.now(),
      });
      var newdoc = _.extend({},olddoc,changes);

      userMust(userId,'write',newdoc);

      var _content = ContentStore.write(content_id(newdoc._id),content);
      newdoc.size = changes.size = _content.size;
      newdoc.encoding = changes.encoding = _content.content_encoding;
      Store.update({address:olddoc.address},{$set:changes});
      return newdoc;
    }
  }
}


