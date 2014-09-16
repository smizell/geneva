var _ = require('lodash'),
    Scope = require("./scope"),
    utils = require("./utils");

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

CoreFunction.prototype.get = function() {
  return this;
}

CoreFunction.prototype.set = function(value) {
  this.value = value;
}

CoreFunction.prototype.call = function(args, global, local) {
  return this.value(args, global, local);
}

function UserFunction(argNames, code) {
  this.argNames = argNames || [];
  this.code = code || null;
}

UserFunction.prototype.get = function() {
  return this;
}

UserFunction.prototype.set = function(value) {
  this.value = value;
}

UserFunction.prototype.call = function(args, global, local) {
  var fnLocal = Scope().merge(local),
      _this = this;
  _.each(_.range(this.argNames.length), function(key) {
    var name = _this.argNames[key],
        val = args[key];
    if (utils.isVar(val)) {
      fnLocal.set(name, global.get(utils.getVarName(val), fnLocal));
    } else if (utils.isFuncCall(val)) {
      fnLocal.set(name, new Variable(global.run(val, fnLocal)));
    } else {
      fnLocal.set(name, new Variable(val));
    }
  });

  return _.last(_.map(_this.code, function(toRun) {
    return global.run(toRun, fnLocal);
  }));
}

module.exports.Variable = Variable;
module.exports.CoreFunction = CoreFunction;
module.exports.UserFunction = UserFunction;