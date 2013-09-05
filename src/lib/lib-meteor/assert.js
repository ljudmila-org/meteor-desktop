assert = function assert(test,status,msg,details) {
  if (test) return true;
  if (!msg) msg = status, status = 400, details = {};
  throw new Meteor.Error(status,msg,details);
}

