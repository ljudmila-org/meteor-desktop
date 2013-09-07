Meteor.subscribe('apps',{
  onError: function(err) {
    console.log('error',err);
  },
  onReady: function(err) {
    console.log('ready',err);
  },
});
Meteor.subscribe('userdata');
Meteor.subscribe('userwindows');
UserDocs.subscribe();
