Actions({
  expose_show: {
    local:true,
    action: function() {
      Session.set('expose',true);
      Actions.menu_hide();
    }
  },
  expose_hide: {
    local:true,
    action: function() {
      Session.set('expose',false);
    }
  }
})
