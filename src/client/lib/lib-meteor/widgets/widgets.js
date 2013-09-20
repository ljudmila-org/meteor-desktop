$.fn.popup = function(c,contsel) {
  var $this = this.eq(0);
  var el = $this.get(0);
  if (!el) return;
  
  var c = c || 'popup';
  contsel = contsel || '.' + c;

  $this.addClass(c);
  el.popup_close = function(e) {
    if ($(e.target).closest(contsel).length) return;
    document.removeEventListener('mousedown',el.popup_close,true);
    delete el.popup_close;
    $this.removeClass(c);
    e.stopPropagation();
  }
  document.addEventListener('mousedown',el.popup_close,true);
}

$.fn.popdown = function() {
  var el = this.get(0);
  if (!el) return;
  el.popup_close && el.popup_close();
}

$.fn.poptoggle = function(c,contsel) {
  var el = this.get(0);
  if (!el) return;
  el.popup_close && el.popup_close() || this.popup(c,contsel);
}

$.fn.edit = function(cb) {
  var el = this.get(0);
  if (!el || el.edit_close) return;

  console.log('editing el',el);

  var $this = this.eq(0);
  
  var d = $this.css('display');
  
  var $input = $('<input type="text" class="edit">').val($this.text());
  
  el.edit_close = function() {
    $input.remove();
    $this.css({display:d});
    delete el.edit_close;
  }
  
  $input.insertBefore($this);
  $this.css({display:'none'});
  $input.change(cb);
  $input.focus();
  $input.blur(el.edit_close);
  console.log('editing done',el);
}
$.fn.unedit = function(cb) {
  var el = this.get(0);
  if (!el) return;
  el.edit_close && el.edit_close();
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
    $dd.poptoggle('active','.body');
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
    e.stopPropagation();
    $dd.popdown();
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
    $dd.popdown();
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
