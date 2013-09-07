DocStore = {
  create: function(storeName) {
    var collectionName = 'pkg_docstore_'+storeName;
    var Store = new Meteor.Collection(collectionName);
  
    return {
      Store: Store,
      subscribe: function(name) {
       Meteor.subscribe(name || collectionName);
      }
    };
  }
}
