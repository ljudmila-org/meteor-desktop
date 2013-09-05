Meteor.Collection.prototype.set = function(find,a1,a2) {
  if (typeof a1 == 'string') {
    var $set = {}; $set[a1]=a2; opt = a2;
  } else {
    var $set = a1;
  }
  this.update(find,{$set:$set});
}

Meteor.Collection.prototype.get = function(find,a1) {
  if (typeof a1 == 'string') {
    var $get = {}; $get[a1] = 1;
  } else {
    var $get = a1;
  }
  var doc = this.findOne(find,{fields:$get});
  if (!doc) return undefined;
  if (typeof a1 == 'string') return doc[a1];
  else return doc;
}

