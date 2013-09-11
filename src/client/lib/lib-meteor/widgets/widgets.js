$.fn.popup = function(c) {
  var $this = this.eq(0);

  var $focus = $('<input style="width:1px;height:1px;font-size:1px;line-height:1px;margin:0;padding:0;opacity:0;position:absolute">');
  $focus.appendTo($this);
  
  var $input = $this.find(':input').eq(0);

  if ($input.length) $input.focus();
  else $focus.focus();

  $this.addClass(c||'popup');
  $this.one('focusout',function(){
    $focus.remove();
    $this.removeClass(c||'popup');
  })
    
}

function unzip(obj) {
  var ret = {};
  if (_.isArray(obj)) return _.map(obj, function(n) {
    return {value:n,label:n};
  });
  if (_.isObject(obj)) return _.map(obj, function(n,i) {
    return {value:i,label:n};
  });
  ret[obj]=obj;
  return ret;
}

function active(obj,val) {
  var ret = {};
  if (!obj) {return {'undefined':undefined}};
  if (_.isArray(obj)) return {value:val,label:val};
  else return {value:val,label:obj[val]};
}

var dropdownHelpers = {
  items: function() {
    return unzip(this.choices);
  },
  current: function() {
    return active(this.choices,this.value);
  }
};

var dropdownEvents = {
  'mousedown .head': function(e,t) {
    var $dd = $(e.target).closest('.widget');
    $dd.popup('active');
    e.preventDefault();
    e.stopPropagation();
  },
};

Template.dropdown.helpers(dropdownHelpers);
Template.dropdown.events(dropdownEvents);
Template.dropdown.events({
  'mousedown .choice': function(e,t) {
    var $ch = $(e.target).closest('.choice');
    var $dd = $ch.closest('.widget');
    var $input = $dd.find('.widget-value');
    var old = $input.val();
    var val = $ch.attr('data-value');
    $input.val(val);
    $dd.fire('select',{old:old,value:val});
  },
})
Template.dropdown.preserve(['.widget'])

Template.button_dropdown.helpers(dropdownHelpers);
Template.button_dropdown.events(dropdownEvents);
Template.button_dropdown.events({
  'mousedown .choice': function(e,t) {
    var $ch = $(e.target).closest('.choice');
    var $dd = $ch.closest('.widget');
    var val = $ch.attr('data-value');
    $dd.fire('select',{value:val});
    e.stopPropagation();
  },
});

Template.upload_file.events({
  'mousedown button': function(e,t) {
    t.find('.widget-upload-file-input').click();
  },
  'change .widget-upload-file-input': function(e,t) {
  
    var el = e.target;
    var wg = $(e.target).closest('.widget').get(0);
    var file = el.files[0];
    if (!file) return;
    
    var data = {file:file};
      
    var accept = _.unique(el.accept.trim().split(/\s*,\s*/));
    
    if (file.type) data.mime = mime(file.type);
    else data.mime = mime.fromname(file.name);
    console.log(data.mime,data.mime.enc);
    
    var fr = new FileReader();
    fr.onload = function() {
      if (data.mime.enc == 'binary') data.content = Uint8Array(fr.result);
      else if (data.mime.enc == 'json') data.content = JSON.parse(fr.result);
      else data.content = fr.result;
      console.log(typeof (data.content));
      $(wg).fire('upload-done',{originalEvent:e,upload:data});
      $(wg).fire('upload-end',{originalEvent:e,upload:data});
    }
    fr.onerror = function(e) {
      data.error = e.error;
      $(wg).fire('upload-error',{originalEvent:e,upload:data});
      $(wg).fire('upload-end',{originalEvent:e,upload:data});
    }
    
    switch(mime.enc) { 
    case 'text': 
    case 'xml': 
    case 'json': 
      fr.readAsText(file); break;
    default:
      fr.readAsBinaryString(file); break;
    }
  }
});

Template.upload_file.preserve(['.widget','input']);
