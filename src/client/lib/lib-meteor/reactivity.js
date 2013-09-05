Reactivity = function (obj,save,wait) {
  
  this.deps = {};
  this.data = {};
  this.assign (obj||{});
  if (save) this.flush = _debounce(wait||1,save);
}

Reactivity.prototype = {
  assign: function(val) {
    if (!val || val.constructor != Object) throw('Reactivity works only for vanilla objects');
    this.obj = {};
    for (var i in this.data) {
      if (!(i in val)) {
        this.set(i,undefined);
        delete this.data[i];
        delete this.deps[i];
      }
    }
    for (var i in val) {
      this.set(i,val[i]);
    }
  },
  get: function (key) {
    this.ensureProp(key);
    this.deps[key].depend();
    return this.obj[key];
  },

  set: function (key, value) {
    this.ensureProp(key);
    if (this.obj[key] === value) return;
    this.obj[key] = value;
    this.deps[key].changed();
    this.flush(this.key);
  },

  ensureProp: function (key) {
    if (!this.deps[key]) {
      Object.defineProperty(this.data,key,{
        enumerable: true,
        configurable: true,
        set: this.set.bind(this,key),
        get: this.get.bind(this,key)
      });
      this.deps[key] = new Deps.Dependency;
    }
  },
  flush: function() {}
};

react = function(arg1,arg2,arg3) {
  if (typeof arg1 != 'function') return new Reactivity(arg1,arg2,arg3);
  var r = new Reactivity(null,arg2,arg3);
  Deps.autorun(function() {
    r.assign(arg1());
  })
  return r;
}
