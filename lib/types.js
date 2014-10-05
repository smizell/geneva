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

    // Gets the value of the supplied arguments
    if (utils.isVar(val)) {
      var argValue = global.get(utils.getVarName(val), fnLocal);
    } else if (utils.isFuncCall(val)) {
      var argValue = new Variable(global.run(val, fnLocal));
    } else {
      var argValue = new Variable(val);
    }

    // Allow for destructuring of arrays
    if (_.isArray(name)) {
      for (i=0; i < name.length; i++) {
        fnLocal.set(name[i], new Variable(argValue.value[i]))
      }
    } else {
      fnLocal.set(name, argValue);
    }
  });

  return _.last(_.map(_this.code, function(toRun) {
    return global.run(toRun, fnLocal);
  }));
}

module.exports.Variable = Variable;
module.exports.CoreFunction = CoreFunction;
module.exports.UserFunction = UserFunction;