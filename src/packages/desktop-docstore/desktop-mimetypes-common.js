parts = function (type) {
  var doc = {};
  var p = type.trim().split(/[/]/);
  doc.main = p.shift(), doc.sub = p.shift();
  
  var p = doc.sub.trim().split(/[+]/);
  doc.submain = p.shift(), doc.subsub = p.shift() || null;
  return doc;
}

guess = function (type) {
  var p = parts(type);
  var m = {
    type: type,
    title: type,
    parts: p,
    ext: ''
  };
  
  m.enc = 'binary', m.accept = m.serve = 'application/octet-stream';
  if (p.main.match(/^(text|message|x-chemical)$/)) m.ext = '.txt',m.enc = 'text', m.accept = 'text/*', m.serve = 'text/plain';
  else if (p.subsub == 'text') m.ext = '.txt',m.enc = 'text', m.accept = 'text/*', m.serve = 'text/plain';
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
