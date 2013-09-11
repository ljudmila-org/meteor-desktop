parts = function (type) {
  var doc = {};
  var p = type.trim().split(/[/]/);
  
  doc.main = p.shift() || 'UNKNOWN', doc.sub = p.shift() || 'UNKNOWN';
  
  var p = doc.sub.trim().split(/[+]/);
  doc.submain = p.shift(), doc.subsub = p.shift() || null;
  return doc;
}

guess = function (type) {
  var p = parts(type);
  var m = {
    type: p.main+'/'+p.sub,
    title: p.main+'/'+p.sub,
    parts: p,
    ext: ''
  };
  
  m.ext = '.txt',m.enc = 'text', m.accept = 'text/*', m.serve = 'text/plain';
  if (p.main.match(/^(video|image|audio)$/) || p.subsub == 'binary')   m.enc = 'binary', m.accept = m.serve = 'application/octet-stream';
  else if (p.subsub == 'xml') m.ext = '.xml', m.enc = 'xml', m.accept = m.serve = 'application/xml';
  else if (p.subsub == 'json') m.ext = '.json', m.enc = 'json', m.accept = m.serve = 'application/json';
  m.ext = p.submain + m.ext;
  return m;
}

mime = function(type) {
  return MimeTypes.findOne(type) || guess(type);
}

mime.guess = guess;
mime.parts = parts;
mime.fromname = function(n) {
  var p = n.split(/[.]/);
  if (n.length == 1) return guess('');
  var ext = p.pop();
  return MimeTypes.findOne({ext:ext}) || guess ('');
}
