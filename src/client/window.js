
AppServer = Messenger.createServer('desktop', {
  commands: {
    'docs_enable': function(args,cb,e) {
      Actions.window_docs_enable({wid:e.data.wid,types:args.types||[]});
    },
  },
});

iframeLoaded = function(el) {
  var domain = el.src.replace(/^([^/]+\/\/[^/]+)(.*)$/,'$1');
  AppServer.connect(el.name,domain,function(err,res) {
    if (err) return Actions.window_console_alert({wid:el.name,message:err});
  });
}

Template.window.helpers({
  active: function() {
    return this.z == Meteor.user().state.z;
  },
  doclist_set: function() {
    var wid = this._id;
    return function(a,b) {
      if (_.isObject(a)) _.each(function(n,i) {
        UserWindows.set(wid,'doclist.'+i,n);
      });
      else UserWindows.set(wid,'doclist.'+a,b);
    }
  },
  doclist_get: function() {
    return UserWindows.get(this._id,'doclist') || {};
  }
})

Template.window.events({
  'mousedown .window': function(e,t) {
    Actions.window_touch({wid:this._id});
    e.stopPropagation();
  },
  'mousedown .window-titlebar': function(e,t) {
    $('iframe[name='+this._id+']').focus()
  },
  'mousedown .window-iframe-cover': function(e,t) {
    $('iframe[name='+this._id+']').focus()
  },
  'mousedown .window-resizer': function(e,t) {
    $('iframe[name='+this._id+']').focus()
  },
  'middledown .window-titlebar': function(e,t) {
    Actions.window_to_back({wid:this._id});
  },
  'mousedown .window-title .doc': function(e,t) {
    return;
    if (this.pane == 'docinfo') Actions.window_pane_hide({wid:this._id});
    else Actions.window_docinfo_show({wid:this._id})
  },
  'change .docinfo-title': function(e,t) {
    Actions.window_doc_rename({wid:t.data._id,docid:t.data.doc._id,title:e.target.value});
  },
  'dblclick .window.normal .window-titlebar': function(e,t) {
    console.log('hey');
    Actions.window_maximize({wid:t.data._id});
  },
  'dblclick .window.maximized .window-titlebar': function(e,t) {
    Actions.window_normalize({wid:t.data._id});
  },
  'click [name=open]': function(e,t) {
    Actions.window_docs_show({wid:t.data._id});
  },
  'open [name=doclist]': function(e,t) {
    Actions.window_doc_open({wid:t.data._id,docid:e.docid});
  },
  'cancel [name=doclist]': function(e,t) {
    Actions.window_docinfo_show({wid:t.data._id});
  },
  'click [name=save]': function(e,t) {
    Actions.window_doc_save({wid:t.data._id});
  },
  'select [name=save-as]': function(e,t) {
    Actions.window_doc_save_as({wid:t.data._id,type:e.value});
  },
  'select [name=publish-as]': function(e,t) {
    Actions.window_doc_publish_as({wid:t.data._id,type:e.value});
  },
  'select [name=new]': function(e,t) {
    Actions.window_doc_new({wid:t.data._id,type:e.value});
  }
});

Template.iframe.preserve(['iframe']);
Template.window.preserve(['.window','.window-resizer','.window-pane-documents','.window-pane-docinfo']);
Template.docinfo.preserve(['.docinfo-title']);

function windowID (wid,user) {
  var w = UserWindows.findOne(wid);
  return w && w.owner === user._id;
}

var renderedWindows = {};
Template.window.destroyed = function() {
  delete renderedWindows[this.data._id];
}

Template.window_console.events({
  'mousedown [name=dismiss]': function(e,t) {
    Actions.window_console_dismiss({wid:t.data._id,mid:this.value._id});
  }
})

Template.window.rendered = function() {
  var me = this;
  var $window = $(this.find('.window'));
  if(renderedWindows[me.data._id]) return;
  renderedWindows[me.data._id] = true;
  $window
  .drag('start',function( ev, dd ){
    $(this).addClass('dragging');
    $('#overlay').css('display','block');
  },{
    handle:'.window-title',
    relative:true
  })
  .drag(function( ev, dd ){
    $window.css({
       top: dd.offsetY,
       left: dd.offsetX
    });
  },{
    handle:'.window-title',
    relative:true
  })
  .drag('end',function( ev, dd ){
    $(this).removeClass('dragging');
    $('#overlay').css('display','none');
    Actions.window_move({wid:me.data._id,x:dd.offsetX,y:dd.offsetY});
  },{
    handle:'.window-title',
    relative:true
  });
  
  $window.find('.window-resizer')
  .mousemove(function(e) {
    var c = '';
    if (e.offsetY < 20) c+='n'    
    else if (e.offsetY > me.data.h - 20) c+='s'    
    if (e.offsetX < 20) c +='w'    
    else if (e.offsetX > me.data.w - 20) c +='e'    
    $(this).css('cursor',c+'-resize');
  })
  .drag("init",function(){
  
  })
  .drag("start",function( e, dd ){
    $(this).closest('.window').addClass('dragging');
    $('#overlay').css('display','block');
    dd.width = $window.width();
    dd.height = $window.height();
    dd.attr = '';
    dd.left = $('#desktop').offset().left;
    dd.top = $('#desktop').offset().top;
    if (e.offsetY < 20) {
      dd.attr+='n'    
    } else if (e.offsetY > dd.height - 20) {
      dd.attr+='s'    
    }
    if (e.offsetX < 20) {
      dd.attr+='w'    
    } else if (e.offsetX > dd.width - 20) {
      dd.attr+='e'    
    }
    $('#overlay').css('cursor',dd.attr+'-resize');
  })
  .drag(function( ev, dd ){
     var props = {};
     if ( dd.attr.indexOf("e") > -1 ){
        props.width = Math.max( 32, dd.width + dd.deltaX );
     }
     if ( dd.attr.indexOf("s") > -1 ){
        props.height = Math.max( 32, dd.height + dd.deltaY );
     }
     if ( dd.attr.indexOf("w") > -1 ){
        props.width = Math.max( 32, dd.width - dd.deltaX );
        props.left = dd.originalX + dd.width - props.width - dd.left;
     }
     if ( dd.attr.indexOf("n") > -1 ){
        props.height = Math.max( 32, dd.height - dd.deltaY );
        props.top = dd.originalY + dd.height - props.height - dd.top;
     }
     $window.css( props );
     dd.props = props;
  })
  .drag('end',function( ev, dd ){
    $(this).closest('.window').removeClass('dragging');
    $('#overlay').css('display','none');
    $('#overlay').css('cursor','default');
    
    var o = $window.offset();
    var d = $('#desktop').offset();
    
    Actions.window_move({wid:me.data._id,w:$window.width(),h:$window.height(),x:o.left-d.left,y:o.top-d.top});
  });
};

var buttonDown = function(e,t) {
  var wid = $(e.target).closest('.window').attr('data-wid');
  var w = {wid:wid};
  Actions.window_touch(w);
  if (this.arg) w[this.arg] = this.value;
  Actions[this.action](w);
  e.preventDefault();
  e.stopPropagation();
};

Template.window_button.events({
  'mousedown .window-button': buttonDown
});
Template.app_button.events({
  'mousedown .app-button': buttonDown
});

Template.docinfo.helpers({
  pub: function() {
    if (!this.doc) return;
    var pub = PublishedDocs.find({docid:this.doc._id});
    return pub;
  }
});
