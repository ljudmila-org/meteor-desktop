
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
  lid_save: function() {
    return 'window-save-'+this._id;
  },
  lid_open: function() {
    return 'window-open-'+this._id;
  },
  lid_publish: function() {
    return 'window-publish-'+this._id;
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
    Actions.window_doc_rename({wid:t.data._id,title:e.target.value});
  },
  'dblclick .window.normal .window-titlebar': function(e,t) {
    console.log('hey');
    Actions.window_maximize({wid:t.data._id});
  },
  'dblclick .window.maximized .window-titlebar': function(e,t) {
    Actions.window_normalize({wid:t.data._id});
  },
  'mousedown [name=open]': function(e,t) {
    Actions.window_pane_show_open({wid:t.data._id});
  },
  'ok [name=pane_open]': function(e,t) {
    console.log('wtf');
    Actions.window_doc_open({wid:t.data._id,path:e.path});
  },
  'cancel [name=pane_save],[name=pane_open]': function(e,t) {
    Actions.window_pane_hide({wid:t.data._id});
  },
  'click [name=save]': function(e,t) {
    Actions.window_doc_save({wid:t.data._id});
  },
  'click [name=save-as]': function(e,t) {
    Actions.window_pane_show_save({wid:t.data._id});
  },
  'click [name=publish]': function(e,t) {
    Actions.window_doc_publish_as({wid:t.data._id,type:e.value});
  },
  'select [name=new]': function(e,t) {
    Actions.window_doc_new({wid:t.data._id,type:e.value});
  },
  'upload-done [name=pane_open]': function(e,t) {
    var wid = t.data._id;
    var u = e.upload;
    Actions.window_doc_set({wid:wid,doc:{
      owner: Meteor.userId(),
      type: u.mime.type,
      content: u.content,
      title: u.file.name
    }});
  },
  'upload-error [name=pane_open]': function(e,t) {
    var wid = t.data._id;
    Actions.window_console_alert({wid:wid,status:401,message:e.upload.error});
  },
});

Template.iframe.preserve(['iframe']);
Template.window.preserve(['.window','.window-resizer','.window-pane-documents','.window-pane-docinfo']);
Template.docinfo.preserve(['.docinfo-title']);



Template.window_console.events({
  'mousedown [name=dismiss]': function(e,t) {
    Actions.window_console_dismiss({wid:t.data._id,mid:this.value._id});
  }
})


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
    //this should really read from this.doc, but published is not updated there, probably it should be
    var doc = UserDocs.Store.findOne(this.doc._id);
    if (!doc || !doc.published) return null;
    var username = Users.get(doc.owner,'username');
    var pub = doc.published;
    for (var type in pub) pub[type].url = PROTOCOL+'://'+username+'.'+DOMAIN+'/docs/'+ encodeURIComponent(doc.title) +'.'+ type.split('/').join('.');
    return pub;
  },
  cansave: function() {
    return this.doc && this.doclist && this.doclist.types  && this.doclist.types.save && this.doclist.types.save.indexOf(this.doc.type) > -1;
  }
});
