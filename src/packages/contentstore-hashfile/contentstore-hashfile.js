/* PATH HELPERS */

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

/* FS HELPERS */
var fs = Npm.require('fs');
var wrench = Npm.require('wrench');

var writeHashFile = function(hash,content) {
  var path = hashPath(hash);
  if (!fs.existsSync(path)) {
    wrench.mkdirSyncRecursive(hashDir(hash), 0777);
    fs.writeFileSync(path,content);
  }
}

var readHashFile = function(hash) {
  return fs.readFileSync(hashPath(hash));
}

var rmEmptyDir = function(path) {
  var files = fs.readdirSync(path)
  if(files.length==0) fs.rmdirSync(path);
}

var deleteHashFile = function(hash) {
  console.log('deleting',hash);
  fs.unlinkSync(hashPath(hash));
  rmEmptyDir(hashDir(hash,2));
  rmEmptyDir(hashDir(hash,1));
}

function encode(data) {
  if (typeof data == 'string') return {data: new Buffer(data,'utf8'), encoding: 'text'};
  if (data instanceof Uint8Array)  return {data: new Buffer(data), encoding: 'binary'};
  if (_.isObject(data)) return {data: new Buffer(JSON.stringify(data),'utf8'), encoding: 'json'};
  throw('bad content '+String(data));
}

function decode(data, encoding) {
  switch(encoding) {
    case 'text': return data.toString('utf8');
    case 'binary': return data.toString('binary');
    case 'json': return JSON.parse(data.toString('utf8'));
  }
}

/* MD5 HELPER */
var crypto = Npm.require('crypto');
function md5(data) {
  return crypto.createHash('md5').update(data).digest("hex");
}

/* SETUP */

var docstorePath = process.env.CONTENTSTORE_HASHFILE_PATH;
  
if (!docstorePath) throw('Set CONTENTSTORE_HASHFILE_PATH to your content store directory.');

var Hashes = new Meteor.Collection('pkg_contentstore_hashes');
Hashes._ensureIndex({address_hash:1},{unique:true});
Hashes._ensureIndex({content_hash:1});

/* EXPORT */
ContentStore = {
  write: function(address,content) {
    var address_hash = md5(JSON.stringify(address));
    var enc = encode(content);
    var content_hash = md5(enc.data);
    writeHashFile(content_hash,enc.data);
    var size = enc.data.length;
    console.log('writing',address,address_hash,enc.data);
    var olddoc = Hashes.findOne({address_hash:address_hash});
    if (olddoc) {  
      console.log('olddoc',olddoc);  
      var changes = {content_hash:content_hash,size:size,content_encoding:enc.encoding};
      Hashes.update({address_hash:address_hash},{$set:changes});
      if (!Hashes.findOne({content_hash:olddoc.content_hash})) deleteHashFile(olddoc.content_hash);
      for (var i in changes) olddoc[i] = changes[i];
      return olddoc;
    } else {
      var newdoc = { _id: Meteor.uuid(), address:address, address_hash:address_hash, content_hash:content_hash,size:size,content_encoding:enc.encoding};
      Hashes.insert(newdoc);
      return newdoc;
    }
  },
  read: function(address) {
    var address_hash = md5(JSON.stringify(address));
    var h = Hashes.findOne({address_hash:address_hash});
    if (!h) return h;
    var data = readHashFile(h.content_hash);
    h.content = decode(data,h.content_encoding);
    console.log('read data',h.content);
    return h;
  },
  remove: function(address) {
    var address_hash = md5(JSON.stringify(address));
    var old = Hashes.findOne({address_hash:address_hash});
    Hashes.remove({address_hash:address_hash});
    if (old && !Hashes.findOne({content_hash:old.content_hash})) deleteHashFile(old.content_hash);
  }
}

