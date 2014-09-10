var _ = require('lodash'),
    utils = require('./utils');

module.exports.Geneva = Geneva = function() {
  var api = {};

  api.funcs = [];
  api.vars = {};

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
    return this.callFuncByName(func.funcName, func.args);
  }

  api.run = function(funcArray) {
    var context = {
      globalFuncs: api.funcs
    }
    return this.callFunc(funcArray);
  }

  api.addFunc = function(funcName, func) {
    this.funcs.push({ funcName: funcName, func: func });
    return true;
  }

  api.setVar = function(varName, value) {
    this.vars[varName] = value;
    return true;
  }

  api.getVar = function(varName) {
    return this.vars[varName];
  }

  // Core functions

  api.addFunc("geneva", function(args) {
    return _.map(args, function(arg) {
      return api.valueOrCall(arg);
    });
  });

  api.addFunc("identity", function(args) {
    return api.valueOrCall(args[0]);
  });

  api.addFunc("list", function(args) {
    return args.map(function(arg) {
      return api.valueOrCall(arg);
    });
  });

  api.addFunc("value", function(args) {
    return api.getVar(api.valueOrCall(args[0]));
  })

  api.addFunc("func", function(args) {
    return api.getFunc(args[0]);
  });

  api.addFunc("def", function(args) {
    api.setVar(args[0], api.valueOrCall(args[1]));
  });

  // Math functions

  api.addFunc("inc", function(args) {
    var value = api.valueOrCall(args[0]);
    return value + 1;
  });

  api.addFunc("+", function(args) {
    return _.reduce(args, function(total, arg) {
      var value = api.valueOrCall(arg);
      return total + value;
    }, 0);
  });

  api.addFunc("-", function(args) {
    return _.reduce(args, function(total, arg) {
      var value = api.valueOrCall(arg);
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