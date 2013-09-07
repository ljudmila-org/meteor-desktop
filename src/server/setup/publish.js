function isOwner(userId,doc,fieldNames) {
  if (doc.owner != userId) return false; 
  if (_.isArray(fieldNames) && _.contains(fieldNames,'owner')) return false;
  return true;
}
var allowOwner = {
  insert: isOwner,
  update: isOwner,
  remove: isOwner,
  fetch: ['owner']
}

Apps._ensureIndex({title:1},{unique:1});
Apps._ensureIndex({url:1},{unique:1});
Users._ensureIndex({username_lc:1},{unique:1});

Meteor.publish('apps', function() {
  return Apps.find({});
});

Meteor.publish('userwindows', function () {
  return UserWindows.find({owner:this.userId});
});
UserWindows.allow(allowOwner);

Meteor.publish('userdata',function() {
  return Users.find(this.userId,{fields:{profile:1,state:1}});
})

Accounts.onCreateUser(function(options,user){
  user.username_lc = user.username.toLowerCase();
  user.state = {};
  return user;
})

UserDocs.publish();
