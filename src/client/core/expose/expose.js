Template.expose_button.events({
  'mousedown #expose': function(e,t) {
    Actions.expose_show();
  },
  'mousedown #unexpose': function(e,t) {
    Actions.expose_hide();
  }
})

Template.expose_button.show = function() {
  return Session.get('expose');
}
