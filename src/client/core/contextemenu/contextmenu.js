Template.contextmenu.events({
  'mousedown #contextmenu-overlay': function(e,t) {
    Actions.contextmenu_hide({});
  },
  'contextmenu #contextmenu-overlay': function(e,t) {
    Actions.contextmenu_hide({});
  },
  'mousedown #contextmenu li': function(e,t) {
    Actions.contextmenu_action({action:this.value});
  },
})
