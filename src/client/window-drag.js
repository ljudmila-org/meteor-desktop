var renderedWindows = {};
Template.window.destroyed = function() {
  delete renderedWindows[this.data._id];
}
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
