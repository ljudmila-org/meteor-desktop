function windowID (wid,userId) {
  var w = UserWindows.findOne(wid);
  return w && w.owner === userId;
}

var alert = function(wid,message,details) {
  Actions.window_console_alert({wid:wid,message:String(message),details:String(details||'')});
}

Actions({
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
});
