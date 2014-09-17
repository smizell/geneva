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
    var _this = this,
        local = localScope || Scope();

    // Return the variable's value if it's a variable
    if (utils.isVar(code)) {
      return this.get(utils.getVarName(code), local).get();
    }

    // Call the function if it's a function
    if (utils.isFuncCall(code)) {
      var parts = utils.parseFunc(code),
          func = this.get(parts.name);
      return func.call(parts.args, this, local);
    }

    // Run each item if it's an array
    if (_.isArray(code)) {
      return _.map(code, function(item) {
        return _this.run(item, localScope);
      });
    }

    // Run only values if it's an object
    if (_.isObject(code)) {
      return _.reduce(code, function(result, item, key) {
        result[key] = _this.run(item, localScope);
        return result;
      }, {});
    }
    
    // If all else fails, just return the value
    // This will be a string, number, boolean, or null
    return code;    
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
    return _.reduce(args.slice(1), function(total, arg) {
      var value = global.run(arg, local);
      return total - value;
    }, global.run(args[0], local));
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

  api.setCoreFn("let", function(args, global, local) {
    var fnLocal = Scope().merge(local),
        fnArgs = args[0],
        code = args.slice(1),
        keys = _.range(0, fnArgs.length, 2);

    _.each(keys, function(key) {
      fnLocal.set(fnArgs[key], new Variable(global.run(fnArgs[key+1], fnLocal)));
    });

    return _.last(_.map(code, function(toRun) {
      return global.run(toRun, fnLocal);
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

  api.setCoreFn("filter", function(args, global, local) {
    var func = global.run(args[0], local),
        values = global.run(args[1], local);
    return _.reduce(values, function(result, value) {
      var logic = func.call([value], global, local);
      if (!!logic) { result.push(value) };
      return result;
    }, []);
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

  api.setCoreFn("get-in", function(args, global, local) {
    var value = global.run(args[0], local),
        paths = args[1];
    return _.reduce(paths, function(result, path) {
      return result[path];
    }, value);
  });

  api.setCoreFn("assoc-in", function(args, global, local) {
    var value = _.cloneDeep(global.run(args[0], local)),
        paths = args[1],
        newValue = args[2];

    function replaceTree(val, paths, newValue) {
      if (paths.length === 1) {
        val[paths[0]] = newValue;
      } else {
        val[paths[0]] = replaceTree(val[paths[0]], paths.slice(1), newValue);
      }
      return val;
    }

    return replaceTree(value, paths, newValue);
  });

  // Shortcuts

  api.setCoreFn("zero?", function(args, global, local) {
    return global.run(args[0], local) === 0;
  });

  api.setCoreFn("even?", function(args, global, local) {
    return (global.run(args[0], local) % 2) === 0;
  });

  api.setCoreFn("odd?", function(args, global, local) {
    return (global.run(args[0], local) % 2) !== 0;
  });

  // String

  api.setCoreFn("str", function(args, global, local) {
    return _.reduce(args, function(result, arg) {
      return result.concat(arg);
    });
  });

  api.setCoreFn("join", function(args, global, local) {
    return args[1].join(args[0]);
  });

  api.setCoreFn("split", function(args, global, local) {
    return args[0].split(args[1]);
  });

  api.setCoreFn("starts-with?", function(args, global, local) {
    var str = global.run(args[0], local),
        prefix = global.run(args[1], local);
    return str.lastIndexOf(prefix, 0) === 0
  });

  api.setCoreFn("ends-with?", function(args, global, local) {
    var str = global.run(args[0], local),
        suffix = global.run(args[1], local);
    return str.substring(str.length - suffix.length, str.length) === suffix;
  });

  api.setCoreFn("contains?", function(args, global, local) {
    var str = global.run(args[0], local),
        substring = global.run(args[1], local);
    return str.indexOf(substring) > -1;
  });

  return api;
}