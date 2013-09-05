Messenger = (function createMessenger() {
  function uuid() { return ((Math.random()+'').substr(2)*1).toString(36); }
  function nop() {}
  function assert(test,msg) {
    if (!test) throw msg + ': FAILED';
  }
  var clone = function(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

/* 
  C O M M  
*/
  
  var window_send = function(w,domain,data,cb) {
    var data = clone(data);
    if (cb) pending_add(domain,data,cb);
    data.wid = self.name;
    w.postMessage(data,domain);
    //console.log(self.name,'sent',data);
  }

  var response = function(e) {
    var rid = e.data.rsvp;
    if (!rid) return nop;
    return function(err,res,cb) {
      window_send(e.source,e.origin,{token:'res',rid:rid,err:err,res:res},cb);
    };
    
  }

  var handler = function(e) {
    try {
      e.respond = response(e);
      if (e.data.wid === undefined) return;
      if(e.data.err) console.log(self.name,'received',e.domain,e.data);
      
      var w = e.data.wid ? self[e.data.wid] : top;
      //assert (w == self[e.data.wid],'bad window id '+e.data.wid);

      switch (e.data.token) {
      case 'con': 
          var c = Client.clients[e.data.kw];
        assert (c, 'no client for '+e.data.kw);
        assert (!c.server, 'client already connected for '+e.data.kw);
        c.connected(e);
        return;
      case 'res':
        return pending_exec(e);
      case 'req':
        var con = Connection.connections[e.data.cid];
        assert (con, 'bad connection id '+e.data.cid);
        con.on_request(e);
      }
    } catch (err) {
      //throw(err);
      console.log(err);
      e.respond(err);
    }
  }
  self.addEventListener('message',handler);

/* 
  P E N D I N G   C A L L B A C K S
*/
  var pending = {};
  var pending_add = function(domain,data,cb) {
    var rsvp = data.rsvp = uuid();

    pending[rsvp] = function(e) {
      try {
        assert(domain == e.origin,'bad response');
        cb(e.data.err,e.data.res,e.respond);
      } catch (err) {
        console.log(err);
        e.respond(err);
      }
    };
  }
  
  var pending_exec = function(e) {
    var data = e.data;
    pending[data.rid](e);
    delete pending[data.rid];
  }


/* 
  C O N N E C T I O N S
*/

  function Connection (owner,mode,wid,domain,cid) {
    this.owner = owner;
    this.mode = mode;
    this.cid = cid || uuid();
    this.wid = wid;
    this.window = wid ? self[wid] : top;
    this.domain = domain;
    Connection.connections[this.cid] = this;
  }

  Connection.connections = {};

  Connection.prototype = {
    send: function (data,cb) {
      if (this.disconnected) {
        cb && cb('disconnected');
        return;
      }
      data = clone(data);
      data.cid = this.cid;
      window_send(this.window,this.domain,data,cb);
    },
    on_request: function(e) {
      if (this.disconnected) {
        e.respond('disconnected');
        return;
      }
      try {
        var cmd = this.owner.commands[e.data.cmd];
        assert(cmd,'no such command '+e.data.cmd);
        cmd.call(this.owner,e.data.args,e.respond,e);
      } catch (err) {
        e.respond(String(err));
      }
    },
    disconnect: function() {
      this.disconnected = true;
      delete Connection.connections[this.cid];
    }
  }
/* 
  C L I E N T S
*/
  
  function Client(kw,opt) {
    opt = opt || {};
    if (typeof opt == 'function') opt = {onConnect:opt};
    console.log('client',kw,opt);
    this.server = null;
    this.kw = kw;
    this.commands = opt.commands || {};
    this.onConnect = opt.onConnect;
  }
  
  Client.clients = {};
  Client.create = function(kw,opt) {
    assert (!Client.clients[kw],'client already exists for '+kw);
    Client.clients[kw] = new Client(kw,opt);
    return Client.clients[kw];
  }
  Client.prototype = {
    send: function(cmd,args,cb) {
      this.server.send({
        token: 'req',
        cmd: cmd,
        args: args || {}
      },cb);
    },
    connected: function(e) {
      if (this.server) this.server.disconnect();
      var me = this;
      this.server = new Connection(this,'up',e.data.wid,e.origin,e.data.cid);
      e.respond(null,'OK');
      if (this.onConnect) this.onConnect(e);
    }
  }

/* 
  S E R V E R S
*/
  
  function Server(kw,opt) {
    opt = opt || {};
    this.clients = {};
    this.kw = kw;
    this.commands = opt.commands || {};
    this.onConnect = opt.onConnect || nop;
  }
  Server.servers = {};
  Server.create = function(kw,opt) {
    assert (!Server.servers[kw],'server already exists for '+kw);
    Server.servers[kw] = new Server(kw,opt);
    return Server.servers[kw];
  }
  Server.prototype = {
    send: function(wid,cmd,args,cb) {
      if (!this.clients[wid]) return cb(500,'no such client',{wid:wid});
      this.clients[wid].send({
        token: 'req',
        cmd: cmd,
        args: args
      },cb);
    },
    connect: function(wid,domain,cb) {
      var me = this;
      if(this.clients[wid]) this.clients[wid].disconnect();
      var con = new Connection(this,'down',wid,domain);
      con.send({
        token: 'con',
        kw: me.kw
      }, function(err,res,cb2) {
        if (!err) me.clients[wid] = con;
        else con.destroy(), console.log(err);
        cb2(err,res);
      })
      return con;
    }
  }

  return {
    createServer: Server.create.bind(Server),
    createClient: Client.create.bind(Client),
    get servers() { return Server.servers },
    get clients() { return Client.clients },
  }
})();



var DesktopApp = {
  register: function(opt) {
    var commands = {};
    if (opt.docs) {
      if (opt.docs.create) commands.doc_new = function(args,cb) {
        opt.docs.create[args.type].call(DesktopApp,cb);
      }
      if (opt.docs.open) commands.doc_open = function(args,cb) {
        opt.docs.open[args.type].call(DesktopApp,args.content,cb);
      }
      if (opt.docs.save) commands.doc_save = function(args,cb) {
        opt.docs.save[args.type].call(DesktopApp,cb);
      }
    }
    Messenger.createClient('desktop', {
      commands: commands,
      onConnect: function() {
        if (opt.docs) this.send('docs_enable',{types:{
          create: Object.keys(opt.docs.create || {}),
          open: Object.keys(opt.docs.open || {}),
          save: Object.keys(opt.docs.save || {}),
        }});
      }
    });
  }
}
