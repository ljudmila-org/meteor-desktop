Actions({
  menu_show: {
    local:true,
    action: function() {
      Session.set('menu_show',true);
    }
  },
  menu_hide: {
    local:true,
    action: function() {
      Session.set('menu_show',false);
    }
  }
})
