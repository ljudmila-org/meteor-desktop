
Template.documents.helpers({
  docs: function() {
    var filter = {};
    switch(this.type) {
    case undefined:
    case 'all': break;
    case 'supported':
      filter.type = {$in:this.types.open};
      break;
    default:
      filter.type = this.type;
    }
    var docs = UserDocs.Store.find();
    return docs;
  },
  typelist: function() {
    switch(this.dialog) {
    case 'open':
      var ret = {'supported': 'Supported types'};
      this.types.open.forEach(function(n) {ret[n]=n});
      ret['all']='All types';
      return ret;
    case 'save':
      return this.types.save.concat();
    default:
      return ['all'];
    }
  },
  uploadtypes: function() {
    var ret = this.types.open.map(function(n){return mime(n).accept}).join(',');
    console.log('upload types',this.types.open,ret);
    return ret;
  }
});

function $up(e,sel) {
  return $(e.target).closest(sel);
}

Template.documents.events({
  'select [name=type]': function(e,t) {
    t.data.set('type',e.value);
  },
  'mousedown .document': function(e,t) {
    var docid = $up(e,'.document').attr('data-docid');
    t.data.set('selected',docid);
  },
  'dblclick .document': function(e,t) {
    $up(e,'.documents').fire('open',{docid:t.data.selected});
  },
  'mousedown .commands [name=open]': function(e,t) {
    $up(e,'.documents').fire('open',{docid:t.data.selected});
  },
  'mousedown .commands [name=cancel]': function(e,t) {
    $up(e,'.documents').fire('cancel');
  },
  'upload-done .commands [name=upload]': function(e,t) {
    e.stopPropagation();
    $up(e,'.documents').fire('upload-done',{originalEvent:e.originialEvent,upload:e.upload});
  }
})

Template.document_button.events({
  'mousedown .doc-button': function(e,t) {
    console.log(this.action);
    Actions[this.action]({docid:this._id});
    e.preventDefault();
    e.stopPropagation();
  },
});


