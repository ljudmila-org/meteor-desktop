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
})


