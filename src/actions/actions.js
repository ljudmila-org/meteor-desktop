function windowID (wid,userId) {
  var w = UserWindows.findOne(wid);
  return w && w.owner === userId;
}

var contextMenuOptions;

Actions({
  app_create: {
    remote:true,
    args: {
      url: /^https?:\/\/.+/
    },
    action: function(args,userId) {
      var app = Apps.findOne({url:args.url});
      if (app) var id = app._id;
      else var id = Apps.insert({url:args.url,scraping:true});
      if(Meteor.isServer) {
        scrapeApp(args.url,function(err,data) {
          if (err) return err;
          console.log('update',id,data);
          Apps.update(id,data);
        });
      }
      return id;
    }
  },
  app_remove: {
    remote:true,
    args: {
      aid: Apps
    },
    action: function(args,userId) {
      Apps.remove(args.aid);
    }
  },
  app_activate: {
    local: true,
    args: {
      aid: Apps
    },
    action: function(args,userId) {
      var w = UserWindows.findOne({'app._id':args.aid,owner:userId});
      if (!w) {
        Actions.window_create({aid:args.aid});
      } else {
        if(w.closed) Actions.window_open({wid:w._id});
        Actions.window_unhide({wid:w._id});
        Actions.window_touch({wid:w._id});
      }
    }
  },
})
