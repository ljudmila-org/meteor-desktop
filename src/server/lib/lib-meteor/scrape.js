var URL = Npm.require('url');
scrapeApp = function (url,cb) {
  Meteor.http.get(url, {followRedirects:true}, function(err, res) {
    if (err || !res.content) return cb(err||'no content',null);
    var data = res.content.replace(/\s+/g,'');
    var data = res.content.replace(/^.*?<head.*?>|<styl.*?>.*?<\/style.*?>|<script.*?>.*?<\/script.*?>|<\/head.*?>.*?$/gim,'');
    console.log('data',data);
    if (!data) return null;
    var ret = {};
    var m;
    if (m=data.match(/<title[\s\S]*?>([\s\S]*?)<\/title[\s\S]*?>/i)) {
      ret.title = m[1];
    } else {
      ret.title = url
    }
    var p = data.split(/<(meta|link)\s+([\s\S]*?)\/?>/i);
    console.log(p);
    for (var i=1; i<p.length; i+=3) {
      var tag = p[i];
      var attr = {};
      var pp = p[i+1].trim().split(/\s*=\s*"([^"]+)"\s*/);
      for (var j=0;j<pp.length-1;j+=2) {
        attr[String(pp[j]).toLowerCase()]=pp[j+1];
      }
      console.log(tag,attr);
      switch (tag.toLowerCase()) {
      case 'meta': 
        switch(attr.itemprop||attr.name||attr.property) {
        case 'image':
        case 'og:image':
          if (!attr.content.match(/\.ico$/) || !ret.icon ) ret.icon = URL.resolve(url,attr.content); break;
        case 'description':
          ret.description = attr.content; break;
        case 'keywords':
          ret.keywords = attr.content; break;
        }; break;
      case 'link': 
        switch(attr.rel) {
        case 'shortcut icon':
        case 'apple-touch-icon':
        case 'fluid-icon':
        case 'icon':
          if (!attr.href.match(/\.ico$/) || !ret.icon ) ret.icon = URL.resolve(url,attr.content||attr.href); break;
        }; break;
      }
    }
    ret.icon = ret.icon || '/img/red/question-button.png';
    ret.url = url;
    console.log(ret);
    cb(null,ret);
  });
}
