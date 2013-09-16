var MimeTypes = new Meteor.Collection('pkg_mimetypes_types');
Meteor.publish('pkg_mimetypes_types',function(){return MimeTypes.find()});
var fs = Npm.require('fs');
Meteor.startup(function() {
  if (!MimeTypes.findOne()) {
    console.log('Initializing MimeTypes');
    console.time('MimeTypes init');
    var etc = Assets.getText('mimetypes.txt').toString();
    etc
    .trim()
    .split(/\s*\n\s*/)
    .filter(Boolean)
    .forEach(function(line) {
      var doc = {};
      var p = line.trim().split(/\t/);
      if(p.length != 4) {
        console.log('wtf',line);
        return;
      }
      doc.title = p.shift(), doc._id = doc.type = doc.accept = doc.serve = p.shift(), doc.ext = p.shift(), doc.enc = p.shift();
      doc.parts = mime.parts(doc.type);
      MimeTypes.insert(doc);
    });
    console.timeEnd('MimeTypes init');
  }
})


