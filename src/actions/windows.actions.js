
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
  Actions.window_console_alert({wid:wid,message:message,details:details||''});
}

Actions({
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
  window_touch: {
    silent:true,
    args: { wid: windowID },
    action: function(args,userId) {
      var topz = Users.get(userId,'state').z;
      var thisz = UserWindows.get(args.wid,'z');
      if (topz == thisz) return;
      var h = UserWindows.findOne({closed:false,hidden:false},{sort:{z:-1}});
      if (!h) return;
      var z = h.z;
      var z = ( h.z | 0 ) + 1;
      UserWindows.update(args.wid,{$set:{z:z}});
      Users.set(userId,'state.z',z);
    },
  },
  window_to_back: {
    local: true,
    args: { wid: windowID },
    action: function(args,userId) {
      var l = UserWindows.findOne({},{sort:{z:1}});
      if (l._id == args.wid) return;
      var z = ( l.z | 0 ) - 1;
      UserWindows.update(args.wid,{$set:{z:z}});
      var h = UserWindows.findOne({closed:false,hidden:false},{sort:{z:-1}});
      Actions.window_touch({wid:h._id});
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
  window_docs_show: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      UserWindows.set(args.wid,'pane','documents');
    },
  },
  window_docinfo_show: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      UserWindows.set(args.wid,'pane','docinfo');
    },
  },
  window_pane_hide: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      UserWindows.set(args.wid,'pane','none');
    },
  },
  window_docs_enable: {
    local:true,
    args: { wid: windowID },
    action: function(args,userId) {
      UserWindows.set(args.wid,{docs_enabled:true, 'doclist.types':args.types,'doclist.type':'supported'});
      if (Meteor.isServer) return;
      var doc = UserWindows.get(args.wid,'doc');
      if (doc) {
        Actions.window_doc_set({wid:args.wid,doc:doc});
        return;
      } else {
        if (!args.types.create) return;
        var type = args.types.create[0];
        if (type) Actions.window_doc_new({wid:args.wid,type:type});
      }
    },
  },
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
      docid: String,
    },
    action: function(args,userId) {
      Actions.doc_open({docid:args.docid},function(err,res) {
        if (err) return Actions.window_console_alert({wid:args.wid,message:err});
        console.log('opened',res);
        var types = UserWindows.get(args.wid,'doclist').types;
        if (types.open.indexOf(res.type)<0) return alert(args.wid,'Application cannot open '+res.type,':'+types.open.join(','));
        Actions.window_doc_set({wid:args.wid,doc:res});
        Actions.window_pane_hide({wid:args.wid});
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
      AppServer.send(args.wid,'doc_new',{type:args.type},function(err,res) {
        var title = res.title += ' ' + moment().format('YYYY-MM-DD hh:mm:ss');
        if (err) return Actions.window_console_alert({wid:args.wid,message:err});
        Actions.window_doc_set({wid:args.wid, doc:{owner:userId, title: res.title, type: args.type, content: res.content}});
      })
    }
  },
  window_doc_save_as: {
    local:true,
    args: {
      wid: windowID,
      type: String
    },
    action: function(args,userId) {
      var doc = UserWindows.get(args.wid,'doc');
      if (!doc) return;
      AppServer.send(args.wid,'doc_save',{type:args.type},function(err,res) {
        if (err) return alert(args.wid,"Application couldn't save",err);
        var ins = {
          content: res,
          type: args.type,
          title: doc.title + ' (copy) '+ moment().format('YYYY-MM-DD hh:mm:ss')
        };
        Actions.doc_new(ins,function(err,res) {
          if (err) return Actions.window_console_alert({wid:args.wid,message:err});
          UserWindows.set(args.wid,'doc',res);
          var sel = '#window-'+args.wid +' input.docinfo-title';
          $(sel).val(res.title);
          $(sel).focus();
          $(sel).select();
        })
      })
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
  window_doc_save: {
    local: true,
    args: {
      wid: windowID,
    },
    action: function(args,userId) {
      var doc = UserWindows.findOne(args.wid).doc;
      if (!doc) return;
      AppServer.send(args.wid,'doc_save',{type:doc.type},function(err,res) {
        if (err) return alert(args.wid,"Application couldn't save",err);
        Actions.doc_save({owner: doc.owner,title:doc.title,type:doc.type,content:res},function(err,res){
          if (err) return console.log(err);
          UserWindows.set(args.wid,'doc',res);
        });
      });
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
      docid: String,
      title: String
    },
    action: function(args,userId) {
      Actions.doc_rename({docid:args.docid,title:args.title},function(err,res) {
        if (err) return Actions.window_console_alert({wid:args.wid,message:err});
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
      UserWindows.set(args.wid,'doc',args.doc);
      console.log('docset',args);
      AppServer.send(args.wid,'doc_open',{content:args.doc.content,type:args.doc.type},function(err,res) {
        if (err) return Actions.window_console_alert({wid:args.wid,message:err});
      });
    }
  },
})
