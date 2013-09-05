
Meteor.startup(function() {
  function showTime() {
    $('#clock').html(moment().format('ddd HH:mm'));
  };
  showTime();
  Meteor.setInterval(showTime,15000);
})


