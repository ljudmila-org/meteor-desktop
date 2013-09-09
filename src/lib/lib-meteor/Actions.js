Actions = function(obj) {
  for (var i in obj) {
    Actions._defs[i] = obj[i];
    if (obj[i].local) {
      if (Meteor.isClient) Actions[i] = Actions._call.bind(Actions,i);
    } else if (obj[i].remote) {
      Actions[i] = Meteor.call.bind(Meteor,'action_remote',i);
    } else {
      Actions[i] = Meteor.call.bind(Meteor,'action',i);
    }
  }
};
Actions._defs = {};

Actions._call = function(name,args,cb) {
  try {
    var userId =Meteor.userId();
    var a = Actions._defs[name];
    if (!a.silent) console.log((a.remote ? 'REMOTE ':'')+'ACTION',name);
    if (!a) throw new Meteor.Error(400,'bad action name '+name);
    if (!match(userId,a.args,args)) throw new Meteor.Error(400,'bad args for action '+name+' << '+JSON.stringify(args) + '>>');
    return a.action(args,userId,cb);
  } catch (err) {
    console.log('ERROR IN ACTION',name,err.stack||err);
    throw err;
    if (cb) cb(err);
    throw new Meteor.Error(500,String(err),{details:'none yet'});
  }
},


Meteor.methods({
  action: function(name,args) {
    return Actions._call(name,args);
  },
});

if (Meteor.isServer) {
  Meteor.methods({
    action_remote: function(name,args) {
      return Actions._call(name,args);
    },
  });
} 

function match(userId,p,v) {
  switch (p) {
    case 'any': return true;
    case String: 
    case 'string': return typeof(v)==='string';
    case Number: 
    case 'number': return typeof(v)==='number';
    case Boolean: 
    case 'boolean': return typeof(v)==='boolean';
    case 0:
    case 'integer': return (v|0) === v;
    case undefined:
    case 'undefined': return v === undefined;
    case null:
    case 'null': return v === null;
  }
  if (typeof(p) === 'function')           return p(v,userId);
  if (p instanceof RegExp)                return typeof(v)==='string' && v.match(p);
  if (Array.isArray(p) && p.length == 1)  return Array.isArray(v) && v.every(match.bind(this,userId,p[0]));
  if (p && p.constructor === Object)      return v && v.constructor === Object && _.every(v,function(vv,i) { return !(i in p) || match(userId,p[i],vv) });
  return true;
}
