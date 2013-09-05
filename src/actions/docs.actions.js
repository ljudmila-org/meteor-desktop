
function docID (docid,user) {
  var d = UserDocs.findOne(docid);
  return d && d.owner === user._id;
}

var toJSON = function(obj) {
  try {
    return JSON.stringify(obj);
  } catch(e) {
    return String(obj);
  }
}

var toPrettyJSON = function(obj) {
  if (typeof obj=='string') return obj;
  try {
    return JSON.stringify(obj,null,2);
  } catch(e) {
    return String(obj);
  }
}


var fromJSON = function(obj) {
  try {
    return JSON.parse(obj);
  } catch(e) {
    return String(obj);
  }
}

if (Meteor.isServer) {

  Meteor.Router.add('/docs/:title', function(title) {
    var host = this.request.headers.host;
    var name = host.split('.')[0];
    var uid = Users.get({username:name},'_id');
    if (!uid) return [404,'nothing found'];
    var doc = PublishedDocs.findOne({title:title,owner:uid});
    if (!doc) return [404,'nothing found'];
    
    var content = readHashFile(doc.hash);
    if (typeof content == 'string') {
      return [200,{'Content-Type':doc.type},content]
    } else {
      var ret = toPrettyJSON(content);
      return [200,{'Content-Type':'application/json'},ret];
    }
  });

  Meteor.Router.add('/docs', function(title) {
    var host = this.request.headers.host;
    var name = host.split('.')[0];
    var uid = Users.get({username:name},'_id');
    if (!uid) return [404,'nothing found'];
    var ret = PublishedDocs.find({owner:uid},{sort:{title:1}}).map(function(n) {
      return '<a href="/docs/'+n.title+'">'+n.title+'</a> '+n.type+' ('+n.size + ' b)';
    });
    return [200,{'Content-Type':'text/html'},ret.join('<br>')]
  });


  var fs = Npm.require('fs');
  var wrench = Npm.require('wrench');

  var docstorePath = process.env.DESKTOP_DOCSTORE || '/home/zocky/var/desktop-docstore';

  var rmEmptyDir = function(path,cb) {
    var files = fs.readdirSync(path)
    if(files.length==0) fs.rmdirSync(path,cb);
  }

  var hashPrefix = function(hash,len) {
    len = len || 2;
    return hash.split(/(..)/,len*2).filter(Boolean).join('/');
  }
  var hashDir = function(hash,len) {
    return docstorePath + '/' + hashPrefix(hash,len);
  }
  var hashPath = function(hash) {
    return hashDir(hash) + '/'+hash;
  }
  var readHashFile = function(hash) {
    return fromJSON(fs.readFileSync(hashPath(hash)));
  }
  var deleteHashFile = function(hash) {
    console.log('deleting',hash);
    fs.unlinkSync(hashPath(hash));
    rmEmptyDir(hashDir(hash,2));
    rmEmptyDir(hashDir(hash,1));
  }
  var maybeDeleteHashFile = function(hash) {
    var rest = UserDocs.findOne({hash:hash},{fields:{hash:1}});
    if (rest) return;
    var rest = PublishedDocs.findOne({hash:hash},{fields:{hash:1}});
    if (rest) return;
    deleteHashFile(hash);
  }
  
  var writeHashFile = function(content) {
    var cnt = toJSON(content);
    var hash = CryptoJS.MD5(cnt).toString();
    var path = hashPath(hash);
    if (!fs.existsSync(path)) {
      wrench.mkdirSyncRecursive(hashDir(hash), 0777);
      fs.writeFileSync(path,cnt);
    }
    console.log('saving to',path);
    return {hash:hash,size:fs.statSync(path).size};
  }
}


Actions({
  doc_new: {
    remote: true,
    args: {
      title: String,
      type: /^[-\w]+\/[-\w]+$/,
      content: 'any',
    },
    action: function(args,user) {
      if (Meteor.isClient) return console.log('wtf are we doing here');
      var now = Date.now();
      var save = writeHashFile(args.content);
      var ins = {
        title: args.title,
        type: args.type,
        owner: user._id,
        cdate: now,
        cuser: user._id,
        mdate: now,
        muser: user._id,
        hash: save.hash,
        size: save.size
      };
      var id = UserDocs.insert(ins);
      ins._id = id;
      ins.content = args.content;
      return ins;
    },
  },
  doc_save: {
    remote: true,
    args: {
      docid: docID,
      content: Object
    },
    action: function(args,user) {
      var oldhash = UserDocs.get(args.docid,'hash');
      var save = writeHashFile(args.content);
      UserDocs.set(args.docid,{
        hash: save.hash,
        size: save.size,
        mdate: Date.now(),
        muser: user._id,
      });
      maybeDeleteHashFile(oldhash);
      return UserDocs.findOne(args.docid);
    }
  },
  doc_rename: {
    remote: true,
    args: {
      docid: docID,
      title: String
    },
    action: function(args,user) {
      if (!args.title) return UserDocs.get(args.docid,'title');
      var title = args.title.substr(0,200);
      UserDocs.set(args.docid,'title',title);
      return title;
    }
  },
  doc_publish: {
    remote: true,
    args: {
      docid: docID,
      type: String,
      title: String,
      content: Object
    },
    action: function(args,user) {
      var title = args.title.replace(/\s+/g,'_');
      var old = PublishedDocs.findOne({title:title,owner:user._id});
      var save = writeHashFile(args.content);
      if (old) PublishedDocs.remove(old._id);
      var id = PublishedDocs.insert({
        docid: args.docid,
        owner: user._id,
        title: title,
        type: args.type,
        pdate: Date.now(),
        hash: save.hash,
        size: save.size
      })
      if (old) maybeDeleteHashFile(old.hash);
      return id;
    }
  },
  doc_unpublish: {
    remote: true,
    args: {
      pubid: PublishedDocs,
    },
    action: function(args,user) {
      var old = PublishedDocs.findOne({_id:args.pubid,owner:user._id});
      if (!old) return;
      PublishedDocs.remove(args.pubid);
      maybeDeleteHashFile(old.hash);
    }
  },
  doc_open: {
    remote: true,
    args: {
      docid: docID,
    },
    action: function(args,user) {
      var doc = UserDocs.findOne(args.docid);
      doc.content = readHashFile(doc.hash);
      return doc;
    }
  },
  doc_remove: {
    remote: true,
    args: {
      docid: docID,
    },
    action: function(args,user) {
      var hashes = [UserDocs.findOne(args.docid).hash];
      PublishedDocs.find({docid:args.docid}).forEach(function(n) {
        hashes.push[n.hash];
      })
      UserDocs.remove(args.docid);
      PublishedDocs.remove({docid:args.docid});
      hashes.forEach(maybeDeleteHashFile);
    }
  },
});