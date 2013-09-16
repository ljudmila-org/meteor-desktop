function windowID (wid,userId) {
  var w = UserWindows.findOne(wid);
  return w && w.owner === userId;
}

var alert = function(wid,message,details) {
  Actions.window_console_alert({wid:wid,message:String(message),details:String(details||'')});
}

Actions({
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
})


