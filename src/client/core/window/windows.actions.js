debug = console.log.bind(console);
if (Meteor.isClient) {
  $(self).on('beforeunload', function(){ 
  	Actions.window_doc_autosave_all();
    for (var i=1;i<1000*1000;i++){};
  });
  
  Meteor.setInterval(function(){
  	Actions.window_doc_autosave_all();
  },120000);
};

function windowID (wid,userId) {
  var w = UserWindows.findOne(wid);
  return w && w.owner === userId;
}

var alert = function(wid,message,details) {
  Actions.window_console_alert({wid:wid,message:String(message),details:String(details||'')});
}

Actions({
  window_touch: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      var topw = UserWindows.findOne({},{sort:{z:-1}});
      
      UserWindows.set(UserWindows.get({active:true},'_id'),{active:false});
      UserWindows.set(args.wid,{active:true,z:topw._id == args.wid ? topw.z : topw.z+1});
      Actions.menu_hide();
      Actions.expose_hide();
    },
  },
  window_to_back: {
    local: true,
    args: { wid: windowID },
    action: function(args,userId) {
      var bottomw = UserWindows.findOne({},{sort:{z:1}});
      if (bottomw._id == args.wid) return;
      UserWindows.set(args.wid,{z:bottomw.z -1,active:false});

      var topw = UserWindows.findOne({},{sort:{z:-1}});
      Actions.window_touch({wid:topw._id});
    },
  },
  window_create: {
    local: true,
    args: {
      aid: Apps
    },
    action: function(args,userId) {
      var app = Apps.findOne(args.aid);
      var wid = UserWindows.insert({
        app: app,
        owner: userId,
        mdate: Date.now(),
        cdate: Date.now(),
        maximized: false,
        hidden: false,
        closed: false,
        x: 100,
        y: 100,
        w: 640,
        h: 480,
        z: 0,
      })
      Actions.window_open({wid:wid});
    }
  },
  window_duplicate: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      var w = UserWindows.findOne(args.wid);
      Actions.window_create({aid:w.app._id});
    },
  },
  window_remove: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      UserWindows.remove(args.wid);
    },
  },
  window_open: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      UserWindows.set(args.wid,{closed:false,hidden:false,mdate:Date.now()});
      Actions.window_touch({wid:args.wid});
    },
  },
  window_close: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      var w = UserWindows.findOne(args.wid);
      if (w.closed) return;
      function close() {
        Actions.window_hide({wid:args.wid});
        UserWindows.set(args.wid,{'closed':true,mdate:Date.now()});
      }
      
      if (w.doc) {
        AppServer.send(args.wid,'doc_save',{type:w.doc.type},function(err,res) {
          if (err) return alert(args.wid,"Application couldn't save",err);
          UserWindows.set(args.wid,'doc.content',res);
          close();
        });
      } else close();
    },
  },
  window_move: {
    local:true,
    args: {
      wid: windowID,
      x: 'integer',
      y: 'integer',
      w: 'integer',
      h: 'integer',
      console: {log:[]},
      doclist: {types:{}},
      doc: false
    },
    action: function(args,userId) {
      var set = {};
      if ('x' in args) set.x = args.x;
      if ('y' in args) set.y = args.y;
      if ('w' in args) set.w = args.w;
      if ('h' in args) set.h = args.h;
      UserWindows.update(args.wid,{$set:set});
    },
  },
  window_maximize: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      UserWindows.set(args.wid,{maximized:true});
    },
  },
  window_normalize: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      UserWindows.set(args.wid,{maximized:false});
    },
  },
  window_hide: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      Actions.window_to_back({wid:args.wid});
      UserWindows.set(args.wid,{hidden:true});
    },
  },
  window_unhide: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      UserWindows.set(args.wid,{hidden:false});
      Actions.window_touch({wid:args.wid});
    },
  },
  window_reload: {
    local: true,
    args: { wid: windowID },
    action: function(args,userId) {
      var w = UserWindows.findOne(args.wid);
      $('iframe[name='+args.wid+']').attr('src',w.app.url);
    },
  },
  window_pane_hide: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      UserWindows.set(args.wid,'pane','none');
    },
  },
  window_pane_show_open: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      UserWindows.set(args.wid,'pane','open');
      DocList('window-open-'+args.wid).cd('.');
    },
  },
  window_pane_show_save: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      UserWindows.set(args.wid,'pane','save');
      DocList('window-save-'+args.wid).cd('.');
    },
  },
  window_pane_show_docinfo: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      UserWindows.set(args.wid,'pane','docinfo');
    },
  },

/**************************
*
* window_console_*
*
***************************/

  window_console_show: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      UserWindows.set(args.wid,'console.show',true);
    },
  },
  window_console_hide: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      UserWindows.set(args.wid,'console.show',false);
    },
  },
  window_console_log: {
    local:true,
    args: { 
      wid: windowID,
      message: 'any',
      details: 'any'
    },
    action: function(args,userId) {
      var mid = Meteor.uuid();
      var out = { details: args.details, message: String(args.message && args.message.message || args.message), _id: mid, date: Date.now()};
      UserWindows.set(args.wid,'console.log.'+mid,out);   
    },
  },
  window_console_alert: {
    local:true,
    args: { 
      wid: windowID,
      message: 'any',
      details: 'any',
    },
    action: function(args,userId) {
      console.log('ERROR',args);
      Actions.window_console_log(args);
      Actions.window_console_show({wid:args.wid});
    },
  },
  window_console_dismiss: {
    local:true,
    args: { 
      wid: windowID,
      mid: String,
    },
    action: function(args,userId) {
      UserWindows.unset(args.wid,'console.log.'+args.mid);   
      var l = UserWindows.get(args.wid,'console').log;
      if (!l || !Object.keys(l).length) UserWindows.set(args.wid,'console.show',false);
    },
  },

  
/**************************
*
* window_doc_*
*
***************************/
  
  
  window_docs_enable: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      UserWindows.set(args.wid,{docs_enabled:true, 'doclist.types':args.types,'doclist.type':'supported','doclist.catches':args.catches});
      if (Meteor.isServer) return;
      var doc = UserWindows.get(args.wid,'doc');
      if (doc) {
        Actions.window_app_open({wid:args.wid,doc:doc});
        return;
      } else {
        if (!args.types.create) return;
        var type = args.types.create[0];
        if (type) Actions.window_doc_new({wid:args.wid,type:type});
      }
    },
  },
  window_docs_disable: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      UserWindows.set(args.wid,{docs_enabled:false, docs_types:[]});
    },
  },
  window_doc_open: {
    local:true,
    args: {
      wid: windowID,
      path: String,
    },
    action: function(args,userId) {
      Actions.doc_open({path:args.path},function(err,res) {
        if (err) return Actions.window_alert({wid:args.wid,message:err});
        Actions.window_app_open({wid:args.wid,doc:res}, function() {
          Actions.window_pane_hide({wid:args.wid});
        });
      });
    }
  },
  window_doc_new: {
    local:true,
    args: {
      wid: windowID,
      type: String
    },
    action: function(args,userId) {
      Actions.window_app_new({wid:args.wid,type:args.type},function(res) {
        var title = 'New ' + mime(args.type).title + ' File';
        Actions.window_app_open({wid:args.wid, doc:{type: args.type, title: title, content: res,path:null}}, function(){
          Actions.window_pane_hide({wid:args.wid});
        });
      })
    }
  },
  window_doc_save_as: {
    local:true,
    args: {
      wid: windowID,
      path: String,
      type: String
    },
    action: function(args,userId) {
      Actions.window_app_save({wid:args.wid,type:args.type},function(res) {
        Actions.doc_write({path:args.path,type:args.type,content:res},function(err,res) {
          Actions.window_doc_set({wid:args.wid,doc:res});
          Actions.window_pane_hide({wid:args.wid});
        })
      })
    }
  },
  window_doc_save: {
    local: true,
    args: {
      wid: windowID,
    },
    action: function(args,userId) {
      var doc = UserWindows.get(args.wid,'doc');
      var path = UserWindows.get(args.wid,'docpath');
      if (!doc || !path) return;
      Actions.window_doc_save_as({wid:args.wid,type:doc.type,path:path})
    }
  },
  window_doc_publish_as: {
    local:true,
    args: {
      wid: windowID,
      type: String
    },
    action: function(args,userId) {
      var doc = UserWindows.get(args.wid,'doc');
      if (!doc) return;
      AppServer.send(args.wid,'doc_save',{type:args.type},function(err,res) {
        if (err) return Actions.window_console_alert({wid:args.wid,message:err});
        var pub = {
          docid: doc._id,
          content: res,
          type: args.type,
          title: doc.title
        };
        Actions.doc_publish(pub,function(err,res) {
          if (err) return Actions.window_console_alert({wid:args.wid,message:err});
          console.log('PUBLISHED');
        })
      })
    }
  },
  window_doc_autosave: {
    local: true,
    args: {
      wid: windowID,
    },
    action: function(args,userId,cb) {
      var doc = UserWindows.findOne(args.wid).doc;
      if (doc) {
        AppServer.send(args.wid,'doc_save',{type:doc.type},function(err,res) {
          if (err) return Actions.window_console_alert({wid:args.wid,message:err});
          UserWindows.set(args.wid,'doc.content',res);
          cb && cb(null,res);
        });
      } else {
        cb && cb(null,res);
      }
    }
  },
  window_doc_autosave_all: {
    local: true,
    action: function(args,userId,cb) {
      var count = 0;
      var errs = [];
      UserWindows.find({'doc':{$type:3},closed:false}).forEach(function(n) {
        count++;
        Actions.window_doc_autosave({wid:n._id},function(err,res) {
          if (err) errs.push(err);
          count--;
          if (count == 0) {
            cb && cb(errs.length ? errs : null);
          }
        })
      })
    }
  },
  window_doc_rename: {
    local: true,
    args: {
      wid: windowID,
      path: String,
      title: String
    },
    action: function(args,userId) {
      var path = UserWindows.get(args.wid,'docpath');
      var doc = UserWindows.get(args.wid,'doc');
      if (!path || !doc) return;
      Actions.doc_rename({path:path,title:args.title},function(err,res) {
        if (err) return Actions.window_console_alert({wid:args.wid,message:err});
        UserWindows.set(args.wid,'docpath',res.path);
        UserWindows.set(args.wid,'doc.title',res.title);
      });
    }
  },
  window_doc_set: {
    local:true,
    args: {
      wid: windowID,
      doc: Object,
    },
    action: function(args,userId) {
      if (args.doc.path) {
        var p = args.doc.path.split('/').slice(0,-1).join('/')
        DocList('window-open-'+args.wid).cd(p);
        DocList('window-save-'+args.wid).cd(p);
      }
      UserWindows.set(args.wid,'docpath',args.doc.path);
      UserWindows.set(args.wid,'doc',args.doc);
    },
  },
  window_app_new: {
    local:true,
    args: {
      wid: windowID,
      type: String
    },
    action: function(args,userId,cb) {
      AppServer.send(args.wid,'doc_new',{type:args.type},function(err,res) {
        if (err) return alert(args.wid,"Application couldn't create a new file",err);
        cb && cb(res);
      });
    }
  },
  window_app_save: {
    local:true,
    args: {
      wid: windowID,
      type: String
    },
    action: function(args,userId,cb) {
      AppServer.send(args.wid,'doc_save',{type:args.type},function(err,res) {
        if (err) return alert(args.wid,"Application couldn't save",err);
        cb && cb(res);
      });
    }
  },
  window_app_open: {
    local:true,
    args: {
      wid: windowID,
      doc: Object,
    },
    action: function(args,userId,cb) {
      console.log('opening',args.doc);
      function glob(p,s) {
        return !!s.match(new RegExp('^' + p.replace(/[^\w\s]/g,'\\$&').replace(/\\\*/g,'[^/]*?')+'$'));
      }
      var opt = UserWindows.get(args.wid,'doclist');
      var doc = args.doc;
      if (opt.types.open.indexOf(doc.type)<0) {
        var found;
        doc.type = mime(doc.type).type;
        for (var t in opt.catches) {
          console.log(opt.catches[t],t);
          if (glob(opt.catches[t],doc.type)) { found = t; break; }
        }
        if (!found) return alert(args.wid,'This application cannot open type '+doc.type,opt.types.open);
        doc.type = found;
      }
      var m = mime(doc.type);
      //if (typeof doc.content == 'string' && m.enc == 'json') doc.content = JSON.parse(doc.content);
      AppServer.send(args.wid,'doc_open',{content:args.doc.content,type:args.doc.type},function(err,res) {
        console.log('opened',err,res);
        if (err) return alert(args.wid,"Application couldn't open document",err);
        Actions.window_doc_set({wid:args.wid,doc:args.doc});
        cb && cb(res);
      });
    }
  },
})


