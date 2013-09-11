AppServer = Messenger.createServer('desktop', {
  commands: {
    'docs_enable': function(args,cb,e) {
      Actions.window_docs_enable({wid:e.data.wid,types:args.types||[],catches:args.catches||[]});
    },
  },
});

Meteor.startup(function() {
  document.addEventListener('contextmenu',function(e){
    if(e.target.tagName=='INPUT' || e.target.tagName=='TEXTAREA') return;
    $(':focus').eq(0).blur();
    //e.preventDefault();
  },true);
 
  document.addEventListener('mousedown',function(e){
    if(e.button==0) return;
    if (e.button==1) $(e.target).fire('middledown',{},true,true);
    e.stopPropagation();
    e.preventDefault();
  },true);
})
Template.desktop.windows = function() {
  return UserWindows.find({},{sort:{_id:1}});
} 

Template.dock.windows = function() {
  return UserWindows.find({},{sort:{closed:1,mdate:1}});
}

Template.dock_window.helpers({
  'active': function(e,t) {
    return !this.closed && !this.hidden && this.z == Meteor.user().state.z;
  }
})


Template.dock_window.events({
  'mousedown .dock-icon-image': function(e,t) {
    Actions.menu_hide();
    if (!this.closed && !this.hidden && this.z == Meteor.user().state.z) {
      Actions.window_hide({wid:this._id});
    } else {
      if (this.closed) Actions.window_open({wid:this._id});
      else Actions.window_unhide({wid:this._id});
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


