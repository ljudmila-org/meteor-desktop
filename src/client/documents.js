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

function $up(e,sel) {
  return $(e.target).closest(sel);
}

Template.pane_open.state = Template.pane_save.state = Template.documents.state = function() {
  return this.state = DocList(this.lid).state;
};

Template.documents.helpers({
  docs: function(ctx) {
    var filter = {};
    var type = DocList.lists[this.lid].state.type;
    switch(type) {
    case undefined:
    case 'all': break;
    case 'supported':
      filter.type = {$in:['dir'].concat(this.types)};
      break;
    default:
      filter.type = {$in:['dir'].concat(type)};
    }
//    console.log('filter',filter);
    var docs = DocList.lists[this.lid].find(filter);
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
  },
  icon_big: function() {
    switch((this.type||'').split('/')[0]) {
      case 'dir': return 'folder-close-alt';
      default: return 'file-alt';
    }
  },
  icon_small: function() {
    switch((this.type||'').split(/\//)[0]) {
    case 'text': 
      switch ((this.type||'').split(/\//).pop()) { 
      case 'xml': case 'html': return 'code';
      default: return 'reorder';
      }
    case 'application': 
      switch ((this.type||'').split(/\+/).pop()) { 
      case 'xml': return 'code';
      case 'json': return 'puzzle-piece';
      case 'binary': return 'cog';
      }
    default: return false;
    }
  }
});

Template.pane_save.events({
  'click .commands [name=cmd_ok]': function(e,t) {
    e.stopPropagation();
    e.preventDefault();
    
    var dl = DocList(t.data.lid);
    var state = dl.state;
    $up(e,'.doc-dialog').fire('ok',{data:{path:state.selected,type:state.type}});
  },
  'click .commands [name=cmd_goto]': function(e,t) {
    
    var dl = DocList(t.data.lid);
    var state = dl.state;
    dl.cd(state.selected);

    e.stopPropagation();
    e.preventDefault();
  },
  'click .commands [name=cmd_cancel]': function(e,t) {
    $up(e,'.doc-dialog').fire('cancel');
    e.stopPropagation();
  },
})

Template.pane_open.events({
  'click .commands [name=cmd_ok]': function(e,t) {
    e.stopPropagation();
    e.preventDefault();
    
    var dl = DocList(t.data.lid);
    var state = dl.state;
    $up(e,'.doc-dialog').fire('ok',{data:{path:state.selected,type:state.type}});
  },
  'click .commands [name=cmd_goto]': function(e,t) {
    e.stopPropagation();
    e.preventDefault();
    
    var dl = DocList(t.data.lid);
    var state = dl.state;
    dl.cd(state.selected);
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
    DocList(t.data.lid).cd($(e.target).closest('a').attr('data-path'));
  },
  'select [name=type]': function(e,t) {
    DocList(t.data.lid).set('type',e.value);
    e.stopPropagation();
  },
  'mousedown .document': function(e,t) {
    DocList(t.data.lid).select(this.path);
  },
  'dblclick .document': function(e,t) {
    if (this.path.substr(-1) == '/') DocList(t.data.lid).cd(this.path);
    else $up(e,'.doc-dialog').fire('ok',{data:{path:this.path,type:this.type}});
    e.stopPropagation();
  },
  'input [name=title]': function(e,t) {
    DocList(t.data.lid).selectLater(null,e.target.value);
  }
})

Template.documents.rendered = function() {
}

Template.documents.created = function() {
  console.log('created');
  this.doclist = DocList.create(this.data.lid,this.data.types).cd('/');
}

Template.documents.destroyed = function() {
  this.doclist.destroy();
}

Template.documents.helpers({
  'isdir': function() {
    return this.path && this.path.substr(-1) == '/';
  },
  'typedesc': function() {
    return mime(this.type).title;
  },
});

Template.document_details.helpers({
  'prettysize': function() {
    var bytes = this.size;
    if      (bytes>=1000000000) {bytes=(bytes/1000000000).toFixed(1)+' GB';}
    else if (bytes>=1000000)    {bytes=(bytes/1000000).toFixed(1)+' MB';}
    else if (bytes>=1000)       {bytes=(bytes/1000).toFixed(1)+' KB';}
    else                        {bytes+=' B';}
    return bytes;
  }
});

Template.document_button.events({
  'mousedown .doc-button': function(e,t) {
    Actions[this.action]({docid:this._id});
    e.preventDefault();
    e.stopPropagation();
  },
});

