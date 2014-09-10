var _ = require('lodash'),
    utils = require('./utils');

module.exports.Geneva = Geneva = function() {
  var funcs = {}

  funcs.valueOrCall = function(value) {
    if (_.isArray(value)) {
      return this.callFunc(value);
    }
    return value;
  }

  funcs.callFuncByName = function(funcName, args) {
    return this[funcName](args);
  }

  funcs.callFunc = function(funcArray) {
    var func = utils.parseFunc(funcArray);
    return this.callFuncByName(func.funcName, func.args);
  }

  funcs.run = function(funcArray) {
    return this.callFunc(funcArray);
  }

  funcs.identity = function(args) {
    return this.valueOrCall(args[0]);
  }

  funcs.list = function(args) {
    var _this = this;
    return args.map(function(arg) {
      return _this.valueOrCall(arg);
    });
  }

  // Math functions

  funcs.inc = function(args) {
    var value = _.parseInt(this.valueOrCall(args[0]));
    return value + 1;
  }

  funcs["+"] = function(args) {
    var _this = this;
    return _.reduce(args, function(total, arg) {
      var value = _.parseInt(_this.valueOrCall(arg));
      return total + value;
    }, 0);
  }

  funcs["-"] = function(args) {
    var _this = this;
    return _.reduce(args.slice(1), function(total, arg) {
      var value = _.parseInt(_this.valueOrCall(arg));
      return total - value;
    }, args[0]);
  }

  // Logic

  funcs["="] = function(args) {
    var _this = this;
    return _.reduce(args.slice(1), function(logic, arg) {
      if (arg === args[0]) {
        return true;
      }
      return false;
    }, true);
  }

  funcs["not="] = function(args) {
    var _this = this;
    return _.reduce(args.slice(1), function(logic, arg) {
      if (arg === args[0]) {
        return false;
      }
      return true;
    }, true);
  }

  funcs.if = function(args) {
    var logic = this.valueOrCall(args[0]);
    if (logic) {
      return this.valueOrCall(args[1]);
    } else {
      if (args.length > 2) {
        return this.valueOrCall(args[2]);
      }
      return null;
    }
  }

  return funcs;
}