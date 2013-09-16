var contextMenuOptions = null;
Actions({
  contextmenu_show: {
    local:true,
    args: {
      options: Object,
      x: Number,
      y: Number
    },
    action: function(args,userId) {
      contextMenuOptions = args.options;
      args.options = Object.keys(args.options).map(function(n) {
        return {value:n,label:n}
      })
      Session.set('contextmenu',args);
    },
  },
  contextmenu_action: {
    local:true,
    args: { action: String},
    action: function(args,userId) {
      contextMenuOptions[args.action]();
      Actions.contextmenu_hide();
    },
  },
  contextmenu_hide: {
    local:true,
    args: {},
    action: function(args,userId) {
      contextMenuOptions = null;
      Session.set('contextmenu',null);
    },
  },
})
