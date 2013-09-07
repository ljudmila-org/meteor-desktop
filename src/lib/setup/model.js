Apps = new Meteor.Collection("apps");
AppDocs = new Meteor.Collection("appdocs");
UserWindows = new Meteor.Collection("userwindows");
UserApps = new Meteor.Collection("userapps");
Users = Meteor.users;

UserDocs = DocStore.create('userdocs',{owner:1,title:1}, {type:1}, {
  read: function(userId){ return {'owner':userId}; },
  write: function(userId){ return {'owner':userId}; },
});

var m = __meteor_runtime_config__.ROOT_URL.match(/^(https?):\/\/(.*)$/)
if(!m) die('bad root url');
PROTOCOL = m[1];
DOMAIN = m[2];

console.log(PROTOCOL,DOMAIN);
