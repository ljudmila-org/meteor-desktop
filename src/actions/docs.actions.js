function docID (docid,userId) {
  var d = UserDocs.Store.findOne(docid);
  return !!d;
}

Actions({
  doc_new: {
    remote: true,
    args: {
      title: String,
      type: /^[-\w]+\/[-\w+]+$/,
      content: 'any',
    },
    action: function(args,userId) {
      return UserDocs.write(userId,[userId,args.title],[args.type],args.content);
    },
  },
  doc_save: {
    silent:true,
    remote: true,
    args: {
      owner: String,
      title: String,
      type: String,
      content: 'any'
    },
    action: function(args,userId) {
      return UserDocs.write(userId,[args.owner,args.title],[args.type],args.content);
    }
  },
  doc_publish: {
    silent:true,
    remote: true,
    args: {
      docid: docID,
      content: Object,
      type: String
    },
    action: function(args,userId) {
      var _content = ContentStore.write( [ 'userdocs', 'published', args.docid, args.type ], args.content );
      UserDocs.Store.set(args.docid,'published.'+args.type, {
        pdate: Date.now(),
        size: _content.size,
      });
    }
  },
  doc_unpublish: {
    remote: true,
    args: {
      docid: docID,
      type: String
    },
    action: function(args,userId) {
      ContentStore.remove( [ 'userdocs', 'published', args.docid, args.type ] );
      UserDocs.Store.unset(args.docid,'published.'+args.type);
    }
  },
  doc_unpublish_all: {
    remote: true,
    args: {
      docid: docID,
    },
    action: function(args,userId) {
      var pubs = UserDoc2.Store.get(args.docid,'published');
      for (var i in pubs) {
        ContentStore.remove( [ 'userdocs', 'published', args.docid, i ] );
      }
      UserDocs.Store.set(args.docid,'published', {});
    }
  },
  doc_rename: {
    remote: true,
    args: {
      docid: docID,
      title: String
    },
    action: function(args,userId) {
      var doc = UserDocs.Store.findOne(args.docid);
      return UserDocs.move(userId,[doc.owner,doc.title],[doc.owner,args.title]);
    }
  },
  doc_open: {
    remote: true,
    args: {
      docid: docID,
    },
    action: function(args,userId) {
      var doc = UserDocs.Store.findOne(args.docid);
      return UserDocs.read(userId,[doc.owner,doc.title]);
    }
  },
  doc_remove: { 
    remote: true,
    args: {
      docid: docID,
    },
    action: function(args,userId) {
      var doc = UserDocs.Store.findOne(args.docid);
      for (var i in doc.published) {
        ContentStore.remove( [ 'userdocs', 'published', doc._id, i ] );
      }
      return UserDocs.remove(userId,[doc.owner,doc.title]);
    }
  },
})


if (Meteor.isServer) {

  var URL = Npm.require('url');
  var punycode = Npm.require('punycode');
  var hostToUser = function(host) {
    var parts = host.split('.');
    var pname = parts.shift();
    var name = punycode.toUnicode(pname);
    console.log(name,pname);
    var parenthost = parts.join('.'); 
    if (parenthost !== URL.parse(Meteor.absoluteUrl()).host) return false;
    return Users.get({username:name},'_id');
  }
  
  Meteor.Router.add('/docs/:frag', function(frag) {
    var uid = hostToUser(this.request.headers.host);
    if (!uid) return [404,'nothing found'];

    var m = frag.match(/^(.+)[.]([^.]+)[.]([^.]+)$/);
    if (!m) return [404,'nothing found'];
    
    var title = m[1];
    var type = m[2]+'/'+m[3];

    var doc = UserDocs.Store.findOne({title:title,owner:uid});
    if (!doc) return [404,'nothing found'];
    
    var pub = doc.published && doc.published[type];
    if (!pub) return [404,'nothing found'];
            
    var c = ContentStore.read(['userdocs','published',doc._id,type]);
    if (!c) return [500,'content stash trouble'];
    console.log(c);
    if (c.content_encoding == 'text') {
      return [200,{'Content-Type':type},c.content]
    } else if (c.content_encoding == 'binary') {
      return [200,{'Content-Type':type},c.content]
    } else {
      var ret = JSON.stringify(c.content,null,2);
      return [200,{'Content-Type':'application/json'},ret];
    }
  });
}

Meteor.Router.add('/docs', function(title) {
  var uid = hostToUser(this.request.headers.host);
  if (!uid) return [404,'nothing found'];
  var ret = PublishedDocs.find({owner:uid},{sort:{title:1}}).map(function(n) {
    return '<a href="/docs/'+n.title+'">'+n.title+'</a> '+n.type+' ('+n.size + ' b)';
  });
  return [200,{'Content-Type':'text/html'},ret.join('<br>')]
});
