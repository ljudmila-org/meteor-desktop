Template.contextmenu.events({
  'mousedown #contextmenu-overlay': function(e,t) {
    Actions.contextmenu_hide({});
    e.stopPropagation();
    e.preventDefault();
  },
  'contextmenu #contextmenu-overlay': function(e,t) {
    Actions.contextmenu_hide({});
    e.stopPropagation();
    e.preventDefault();
  },
  'mousedown #contextmenu li': function(e,t) {
    Actions.contextmenu_action({action:this.value});
    e.stopPropagation();
    e.preventDefault();
  },
})
