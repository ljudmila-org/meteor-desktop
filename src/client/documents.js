DocList = (function() {
  var lists = {};
  var State = new Meteor.Collection(null);
  return {
    lists: lists,
    create: function(lid,types) {
      var Store = new Meteor.Collection(null);
      if (!lid) lid = Meteor.uuid();
      if (State.findOne(lid)) throw 'doclist already exists';
      State.insert({_id:lid,cwd:'/',selected:null,type:'all'});
      return lists[lid] = {
        lid: lid,
        cwd: '/',
        cd: function(path,cb) {
          if (path == '..') path = this.cwd.split('/').slice(0,-2).join('/');
          else if (path[0]!='/') path = this.cwd + path;
          if (path.slice(-1)!='/') path = path+'/';
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
        set: function(a1,a2) {
          if (arguments.length>1) c ={}, c[a1] = a2;
          else c = a1;
          State.update(lid,{$set:c});
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
      }
    }
  }
})();

Template.documents.helpers({
  docs: function(ctx) {
    var filter = {};
    switch(this.type) {
    case undefined:
    case 'all': break;
    case 'supported':
      filter.type = {$in:this.types.open};
      break;
    default:
      filter.type = DocList.lists[this.lid].state.type;
    }
    var docs = DocList.lists[this.lid].find();
    return docs;
  },
  parents: function() {
    if (!DocList.lists[this.lid]) return;
    var p = DocList.lists[this.lid].state.cwd.split('/').filter(Boolean);
    var ret = [{fullpath:'/',title:'[root]'}];
    for (var i in p) {
      ret.push({fullpath:'/'+p.slice(0,i+1).join('/')+'/',title:p[i]})
    }
    return ret;
  },
  state: function() {
    console.log('asking for state');
    return this.state = DocList.lists[this.lid].state;
  },
  typelist: function() {
    var ret = {'supported': 'Supported types'};
    this.types.forEach(function(n) {ret[n]=n});
    ret['all']='All types';
    return ret;
  },
  uploadtypes: function() {
    return ['text/html','text/*'];
    var ret = DocList.lists[this.lid].state.open.map(function(n){return mime(n).accept}).join(',');
    return ret;
  }
});

function $up(e,sel) {
  return $(e.target).closest(sel);
}

Template.pane_open.events({
  'click .commands [name=cmd_ok]': function(e,t) {
    e.stopPropagation();
    e.preventDefault();
    var dl = DocList.lists[t.data.lid];
    console.log('clickd',t.data.lid);
    if (dl.state.selected.substr(-1) == '/') dl.cd(dl.state.selected);
    else $up(e,'.doc-dialog').fire('ok',{path:dl.state.selected});
  },
  'click .commands [name=cmd_cancel]': function(e,t) {
    $up(e,'.doc-dialog').fire('cancel');
    e.stopPropagation();
  },
  'upload-done .commands [name=cmd_upload]': function(e,t) {
    e.stopPropagation();
    $up(e,'.doc-dialog').fire('upload-done',{originalEvent:e.originalEvent,upload:e.upload});
  }
})

Template.documents.events({
  'mousedown .parents a': function(e,t) {
    DocList.lists[t.data.lid].cd($(e.target).closest('a').attr('data-path'));
  },
  'select [name=type]': function(e,t) {
    DocList.lists[t.data.lid].set('type',e.value);
    e.stopPropagation();
  },
  'mousedown .document': function(e,t) {
    DocList.lists[t.data.lid].set('selected',this.path);
  },
  'dblclick .document': function(e,t) {
    console.log('hey hey');
    if (this.path.substr(-1) == '/') DocList.lists[t.data.lid].cd(this.path);
    else $up(e,'.doc-dialog').fire('ok',{path:this.path});
    e.stopPropagation();
  },
})

Template.documents.rendered = function() {
}

Template.documents.created = function() {
  console.log('created');
  this.doclist = DocList.create(this.data.lid).cd('/');
}

Template.documents.destroyed = function() {
  this.doclist.destroy();
}

Template.documents.helpers({
  'isdir': function() {
    return this.path && this.path.substr(-1) == '/';
  },
});


Template.document_button.events({
  'mousedown .doc-button': function(e,t) {
    Actions[this.action]({docid:this._id});
    e.preventDefault();
    e.stopPropagation();
  },
});

