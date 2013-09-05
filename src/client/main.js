Meteor.startup(function() {
  document.addEventListener('contextmenu',function(e){
    if(e.target.tagName=='INPUT' || e.target.tagName=='TEXTAREA') return;
    $(':focus').eq(0).blur();
    e.preventDefault();
  },true);
  document.addEventListener('mousedown',function(e){
    if(e.button==0) return;
    e.stopPropagation();
    e.preventDefault();
  },true);
})

Template.desktop.windows = function() {
  return UserWindows.find({});
} 

Template.dock.windows = function() {
  return UserWindows.find({});
}

Template.dock_window.helpers({
  'active': function(e,t) {
    return this.z == Meteor.user().state.z;
  }
})


Template.dock_window.events({
  'mousedown .dock-icon-image': function(e,t) {
    Actions.menu_hide();
    var $w = $(e.target).closest('.dock-icon');
    if ($w.hasClass('active')) {
      Actions.window_hide({wid:this._id});
    } else {
      Actions.window_open({wid:this._id});
    }
  },
  'contextmenu .dock-icon-image': function(e,t) {
    $(e.target).closest('.dock-icon').popup();
  },
  'mousedown .dock-icon-menu li': function(e,t) {
    Actions.menu_hide();
    var action = $(e.target).closest('li').attr('data-action');
    console.log('action',action)
    Actions[action]({wid:this._id});
    e.stopPropagation();
  }
})

