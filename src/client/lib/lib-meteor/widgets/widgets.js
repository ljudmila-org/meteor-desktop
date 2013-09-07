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
  },
});
