var _ = require('lodash');

function Variable(value) {
  this.value = value;
}

Variable.prototype.get = function() {
  return this.value;
}

Variable.prototype.set = function(value) {
  this.value = value;
}

function CoreFunction(fn) {
  this.value = fn;
}

CoreFunction.prototype = Variable;

CoreFunction.prototype.call = function(args, global, local) {
  return this.value(args, global, local);
}

module.exports.Variable = Variable;
module.exports.CoreFunction = CoreFunction;