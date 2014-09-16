var _ = require('lodash'),
    CoreFunction = require("./types").CoreFunction,
    UserFunction = require("./types").UserFunction,
    Variable = require("./types").Variable,
    Scope = require("./scope"),
    utils = require("./utils");

module.exports = Geneva = function(scope) {
  var api = scope || Scope();

  api.setCoreFn = function(fnName, fn) {
    return this.set(fnName, new CoreFunction(fn));
  }

  api.setVar = function(varName, value) {
    return this.set(varName, new Variable(value));
  }

  api.run = function(code, localScope) {
    var local = localScope || Scope();
    if (utils.isVar(code)) return this.get(utils.getVarName(code), local).get();
    if (!utils.isFuncCall(code)) return code;
    var parts = utils.parseFunc(code),
        func = this.get(parts.name);
    return func.call(parts.args, this, local);
  }

  api.setCoreFn("identity", function(args, global, local) {
    return global.run(args[0], local);
  });

  api.setCoreFn("def", function(args, global, local) {
    return global.setVar(args[0], api.run(args[1], local));
  });

  // Math functions

  api.setCoreFn("inc", function(args, global, local) {
    var value = global.run(args[0], local);
    return value + 1;
  });

  api.setCoreFn("+", function(args, global, local) {
    return _.reduce(args, function(total, arg) {
      var value = global.run(arg, local);
      return total + value;
    }, 0);
  });

  api.setCoreFn("-", function(args, global, local) {
    return _.reduce(args, function(total, arg) {
      var value = global.run(arg, local);
      return total - value;
    });
  });

  api.setCoreFn("mod", function(args, global, local) {
    return global.run(args[0], local) % global.run(args[1], local);
  });

  // User Functions

  api.setCoreFn("fn", function(args, global, local) {
    var argNames = args[0],
        code = args.slice(1);
    return new UserFunction(argNames, code);
  });

  api.setCoreFn("defn", function(args, global, local) {
    var funcName = args[0],
        argNames = args[1],
        fnCode = args.slice(2),
        fn = global.run(["!fn", argNames].concat(fnCode), local);
    global.set(funcName, fn);
  });

  api.setCoreFn("do", function(args, global, local) {
    return _.last(_.map(args, function(arg) {
      return global.run(arg, local);
    }));
  });

  // Logic functions

  api.setCoreFn("=", function(args, global, local) {
    return _.reduce(args.slice(1), function(logic, arg) {
      if (arg === args[0]) {
        return true;
      }
      return false;
    }, true);
  });

  api.setCoreFn("not=", function(args, global, local) {
    return _.reduce(args.slice(1), function(logic, arg) {
      if (arg === args[0]) {
        return false;
      }
      return true;
    }, true);
  });

  api.setCoreFn("if", function(args, global, local) {
    var logic = global.run(args[0], local);
    if (logic) {
      return global.run(args[1], local);
    } else {
      if (args.length > 2) {
        return global.run(args[2], local);
      }
      return null;
    }
  });

  api.setCoreFn("cond", function(args, global, local) {
    var keys = _.range(0, args.length, 2);
    return _.reduce(keys, function(result, key) {
      if (!result) {
        if (args[key] === ":else") return global.run(args[key+1], local);
        if (!!global.run(args[key], local)) {
          return global.run(args[key+1], local);
        }
      }
      return result;
    }, null);
  });

  // Functional functions

  api.setCoreFn("map", function(args, global, local) {
    var func = global.run(args[0], local),
        values = global.run(args[1], local);
    return _.map(values, function(value) {
      return func.call([value], global, local);
    });
  });

  api.setCoreFn("reduce", function(args, global, local) {
    var func = global.run(args[0], local),
        values = global.run(args[1], local);
    return _.reduce(values, function(result, value) {
      return func.call([result, value], global, local);
    });
  });

  api.setCoreFn("concat", function(args, global, local) {
    return _.reduce(args, function(result, arg) {
      return result.concat(global.run(arg, local));
    });
  });

  api.setCoreFn("range", function(args, global, local) {
    var values = _.map(args, function(arg) {
      return global.run(arg, local);
    });
    if (values.length === 1) return _.range(values[0]);
    if (values.length === 2) return _.range(values[0], values[1]);
    if (values.length === 3) return _.range(values[0], values[1], values[2]);
  });

  // Shortcuts

  api.setCoreFn("zero?", function(args, global, local) {
    return global.run(args[0], local) === 0;
  });

  return api;
}