debug = console.log.bind(console);
$(self).on('beforeunload', function(){ 
	Actions.window_doc_autosave_all();
  for (var i=1;i<1000*1000;i++){};
});

Meteor.setInterval(function(){
	Actions.window_doc_autosave_all();
},120000);

function windowID (wid,userId) {
  var w = UserWindows.findOne(wid);
  return w && w.owner === userId;
}

var alert = function(wid,message,details) {
  Actions.window_console_alert({wid:wid,message:String(message),details:String(details||'')});
}

Actions({
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
})


