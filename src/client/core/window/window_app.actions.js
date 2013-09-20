debug = console.log.bind(console);

function windowID (wid,userId) {
  var w = UserWindows.findOne(wid);
  return w && w.owner === userId;
}

var alert = function(wid,message,details) {
  Actions.window_console_alert({wid:wid,message:String(message),details:String(details||'')});
}

Actions({
  window_app_new: {
    local:true,
    args: {
      wid: windowID,
      type: String
    },
    action: function(args,userId,cb) {
      AppServer.send(args.wid,'doc_new',{type:args.type},function(err,res) {
        if (err) return alert(args.wid,"Application couldn't create a new file",err);
        cb && cb(res);
      });
    }
  },
  window_app_save: {
    local:true,
    args: {
      wid: windowID,
      type: String
    },
    action: function(args,userId,cb) {
      AppServer.send(args.wid,'doc_save',{type:args.type},function(err,res) {
        if (err) return alert(args.wid,"Application couldn't save",err);
        var dd = UserWindows.get(args.wid,'doclist');
        var enc = dd.encodings.save[args.type];
        console.log('decoding',enc);
        switch (enc) {
          case 'dataurl': res = dataURLToBlob(res); break;
        }
        cb && cb(res);
      });
    }
  },
  window_app_open: {
    local:true,
    args: {
      wid: windowID,
      doc: Object,
    },
    action: function(args,userId,cb) {
      console.log('opening',args.doc);
      function glob(p,s) {
        return !!s.match(new RegExp('^' + p.replace(/[^\w\s]/g,'\\$&').replace(/\\\*/g,'[^/]*?')+'$'));
      }
      var opt = UserWindows.get(args.wid,'doclist');
      var doc = args.doc;
      if (opt.types.open.indexOf(doc.type)<0) {
        var found;
        doc.type = mime(doc.type).type;
        for (var t in opt.catches) {
          console.log(opt.catches[t],t);
          if (glob(opt.catches[t],doc.type)) { found = t; break; }
        }
        if (!found) return alert(args.wid,'This application cannot open type '+doc.type,opt.types.open);
        doc.type = found;
      }
      var m = mime(doc.type);
      //if (typeof doc.content == 'string' && m.enc == 'json') doc.content = JSON.parse(doc.content);
      AppServer.send(args.wid,'doc_open',{content:args.doc.content,type:args.doc.type},function(err,res) {
        console.log('opened',err,res);
        if (err) return alert(args.wid,"Application couldn't open document",err);
        Actions.window_doc_set({wid:args.wid,doc:args.doc});
        cb && cb(res);
      });
    }
  },
})


