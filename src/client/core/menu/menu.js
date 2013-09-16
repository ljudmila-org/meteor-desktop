Template.menu_button.events({
  'mousedown #plus': function(e,t) {
    Actions.menu_show();
  },
  'mousedown #minus': function(e,t) {
    Actions.menu_hide();
  }
})
Template.menu.apps = function() {
  var s = Session.get('app-filter');
  if (!s) return Apps.find({});
  s=s.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  return Apps.find({
    title: {$regex: s, $options:'i'}
  });
}

Template.menu.show = Template.menu_button.show = function() {
  return Session.get('menu_show');
}

var setLater = _.debounce(function(n,v) {
  Session.set(n,v);
},300);

Template.menu.events({
  'keyup [name=filter]': function(e) {
    if (e.which == 27) {
      e.target.value = '';
      Session.set('app-filter',null);
    } else if (e.target.value.match(/^https?:/)) {
      Session.set('app-filter',null);
      if (e.which == 13) {
        console.log(e.target.value);
        var app = Apps.findOne({url:e.target.value});
        if (app) Actions.app_remove({aid:app._id});
        Actions.app_create({url:e.target.value});
        e.target.value = '';
      }
    } else {
      setLater('app-filter',e.target.value);
    }
  }
})

Template.menu_app.events({
  'contextmenu .menu-app': function(e,t) {
    $(e.target).closest('.menu-app').popup();
  },
  'mousedown .menu-app': function(e,t) {
    Actions.app_activate({aid:this._id});
    Actions.menu_hide();
  },
  'mousedown .menu-app-remove': function(e,t) {
    Actions.app_remove({aid:this._id});
    e.stopPropagation();
  },
});
