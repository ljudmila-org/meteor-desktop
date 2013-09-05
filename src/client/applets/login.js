Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'
});

Template._loginButtons.events({
  'mousedown .login-link-text': function(e,t) {
    console.log('clicked');
    var $this = $(t.find('#login-dropdown-list'));
    if ($this.css('display')=='none') $this.css('display','block');
    else $this.css('display','none');
  }
})


