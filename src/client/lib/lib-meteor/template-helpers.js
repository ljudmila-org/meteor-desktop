
Handlebars.registerHelper('eq', function(a, b, ctx) {
  return a == b;
});
Handlebars.registerHelper('ne', function(a, b, ctx) {
  return a != b;
});

Handlebars.registerHelper('gt', function(a, b, ctx) {
  return a > b;
});
Handlebars.registerHelper('lt', function(a, b, ctx) {
  return a < b;
});
Handlebars.registerHelper('ge', function(a, b, ctx) {
  return a >= b;
});
Handlebars.registerHelper('le', function(a, b, ctx) {
  return a <= b;
});

Handlebars.registerHelper('match', function(a, b, c, ctx) {
  if (!ctx) c = '';
  return a.match(new RegExp(b,c));
});
Handlebars.registerHelper('$match', function(a, b, c, ctx) {
  if (!ctx) c = '';
  return Session.get(a).match(new RegExp(b),c);
});

Handlebars.registerHelper('userName', function(user, ctx) {
  var user = user && user._id ? user : Meteor.users.findOne(user);
  return user && user._id ? user.username || user.emails[0].address : undefined; 
});

Handlebars.registerHelper('timef', function(t, f, ctx) {
  var t = moment(t);
  if (!ctx) f = 'DD.MM.YYYY';
  return t && moment(t).format(f);
});

Handlebars.registerHelper('timec', function(t, ctx) {
  return t && moment(t).calendar();
});

Handlebars.registerHelper('percent', function(n, ctx) {
  n = n * 100;
  if (n <10) return n.toFixed(1) + ' %';
  return Math.round(n) + ' %';
});

Handlebars.registerHelper('unzip', function(obj,ctx) {
  var ret = [];
  var c = 0;
  for (var i in obj) ret.push({index:c++,key:i,value:obj[i]});
  return ret;
});

Handlebars.registerHelper('call', function(template){
  var a = {};
  _.initial(arguments).map(function(n,i) {
    a['_'+i] = n;
  })
  var ctx = _.last(arguments);
  var args = _.extend({}, a, ctx.hash);
  if (!Template[template]) return "{{call "+template+"}}";
  return new Handlebars.SafeString(Template[template](args,{data:ctx.data}));
});

Handlebars.registerHelper('include', function(template,ctx){
  var args = _.extend({}, this, ctx.hash);
  if (!Template[template]) return "{{include "+template+"}}";
  return new Handlebars.SafeString(Template[template](args,{data:ctx.data}));
});

Handlebars.registerHelper('apply', function(template,obj,ctx){
  var args = _.extend({}, obj, ctx.hash);
  if (!Template[template]) return "{{apply "+template+"}}";
  return new Handlebars.SafeString(Template[template](args,{data:ctx.data}));
});

Handlebars.registerHelper('$with', function(block){
  var hash = {};
  for (var i in block.hash) hash[i] = Session.get(block.hash[i]);
  hash = _.extend({},this,hash);
  return block.fn(hash);
});

Handlebars.registerHelper('first', function() {
  var args = _.initial(arguments);
  for (var i in args) if (args[i]) return String(args[i]);
  return '';
});

Handlebars.registerHelper('$', function(name, options) {
  return Session.get(name);
})

Handlebars.registerHelper('$eq', function(name,val, options) {
  return Session.get(name) == val;
})

Handlebars.registerHelper('url', function(url, options) {
  var a = document.createElement('a');
  a.href = url;
  return a.href;
})

Handlebars.registerHelper('urlencode', function(s, options) {
  return encodeURIComponent(s);
})


Handlebars.registerHelper('pageUrl', function(options) {
  Meteor.Router.page();
  return document.URL;
})

Handlebars.registerHelper('localPageUrl', function(options) {
  Meteor.Router.page();
  return document.URL.replace(/^[^:]+:(\/\/)?[^\/]+/,'');
})
