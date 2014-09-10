var _ = require('lodash'),
    utils = require('./utils');

module.exports.Geneva = Geneva = function() {
  var api = {};

  // Where the functions will be stored
  api.funcs = [];

  // Currently, anything that is an array is a callable function
  api.isCallable = function(value) {
    return _.isArray(value);
  }

  api.valueOrCall = function(value) {
    if (this.isCallable(value)) {
      return this.callFunc(value);
    }
    return value;
  }

  api.getFunc = function(funcName) {
    var f = _.filter(this.funcs, function(func) {
      return func.funcName === funcName;
    })[0];
    return f.func;
  }

  api.callFuncByName = function(funcName, args) {
    return this.getFunc(funcName)(args);
  }

  api.callFunc = function(funcArray) {
    var func = utils.parseFunc(funcArray);
    if (func.args.length === 0) {
      return this.getFunc(func.funcName);
    }
    return this.callFuncByName(func.funcName, func.args);
  }

  api.run = function(funcArray) {
    return this.callFunc(funcArray);
  }

  api.addFunc = function(funcName, func) {
    this.funcs.push({ funcName: funcName, func: func });
    return true;
  }

  // Core functions

  api.addFunc("identity", function(args) {
    return api.valueOrCall(args[0]);
  });

  api.addFunc("list", function(args) {
    return args.map(function(arg) {
      return api.valueOrCall(arg);
    });
  });

  // Math functions

  api.addFunc("inc", function(args) {
    var value = _.parseInt(api.valueOrCall(args[0]));
    return value + 1;
  });

  api.addFunc("+", function(args) {
    return _.reduce(args, function(total, arg) {
      var value = _.parseInt(api.valueOrCall(arg));
      return total + value;
    }, 0);
  });

  api.addFunc("-", function(args) {
    return _.reduce(args, function(total, arg) {
      var value = _.parseInt(api.valueOrCall(arg));
      return total - value;
    });
  });

  // Logic functions

  api.addFunc("=", function(args) {
    return _.reduce(args.slice(1), function(logic, arg) {
      if (arg === args[0]) {
        return true;
      }
      return false;
    }, true);
  });

  api.addFunc("not=", function(args) {
    return _.reduce(args.slice(1), function(logic, arg) {
      if (arg === args[0]) {
        return false;
      }
      return true;
    }, true);
  });

  api.addFunc("if", function(args) {
    var logic = api.valueOrCall(args[0]);
    if (logic) {
      return api.valueOrCall(args[1]);
    } else {
      if (args.length > 2) {
        return api.valueOrCall(args[2]);
      }
      return null;
    }
  });

  // Functional functions

  api.addFunc("map", function(args) {
    var func = api.valueOrCall(args[0]),
        values = api.valueOrCall(args[1]);
    return _.map(values, function(value) {
      return func([value]);
    });
  });

  api.addFunc("reduce", function(args) {
    var func = api.valueOrCall(args[0]),
        values = api.valueOrCall(args[1]);
    return _.reduce(values, function(result, value) {
      return func([result, value]);
    });
  });

  return api;
}