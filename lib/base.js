var _ = require('lodash');

var Base = function(api, store, local) {
  api.storeVarName = function(varName) {
    return varName.slice(1)
  }

  api.get = function(varName) {
    if (_.has(local, varName)) return local[varName];
    return store[varName];
  }

  api.set = function(name, itemType, value) {
    store[name] = { type: itemType, value: value };
  }

  api.isFuncCall = function(code) {
    if (!Array.isArray(code)) return false;
    if (typeof code[0] !== "string") return false;
    if (code[0].charAt(0) == "!") return true;
    return false;
  }

  api.addFunc = function(funcName, func) {
    this.set(funcName, "func", func);
  }

  api.parseFunc = function(code) {
    return {
      name: this.storeVarName(code[0]),
      args: code.slice(1)
    }
  }

  api.isVar = function(value) {
    if (typeof value !== "string") return false;
    if (value.charAt(0) === "~") return true;
    return false;
  }

  api.setVar = function(varName, value) {
    this.set(varName, "var", value);
  }

  api.setLocal = function(varName, itemType, value) {
    local[varName] = { type: itemType, value: value };
  }

  api.getAllLocal = function() {
    return local;
  }

  api.run = function(code) {
    if (this.isVar(code)) return this.get(this.storeVarName(code)).value;
    if (!this.isFuncCall(code)) return code;
    var parts = this.parseFunc(code),
        func = this.get(parts.name).value;
    return func(parts.args);
  }

  return api;
}

module.exports = Geneva = function(api, store) {
  var store = store || {},
      local = {};

  if (_.isEmpty(api)) {
    var api = Base({}, store, local);

    api.addFunc("identity", function(args) {
      return api.run(args[0]);
    });

    api.addFunc("def", function(args) {
      api.set(args[0], "var", api.run(args[1]));
    });

    api.addFunc("fn", function(args) {
      var argNames = args[0],
          code = args.slice(1);

      return function(fnArgs) {
        var newGeneva = Geneva(api, store);

        // Get values and put them into local storage
        _.each(_.range(argNames.length), function(key) {
          var name = argNames[key],
              val = fnArgs[key];

          // If it's a variable, store it in the local storage
          // under a the new name given for this function. Otherwise,
          // it's stored as a normal variable
          if (newGeneva.isVar(val)) {
            var varObj = newGeneva.get(val);
            newGeneva.setLocal(name, varObj.type, varObj.value);
          } else {
            newGeneva.setLocal(name, "var", val);
          };
        });

        // Run through every piece of code and get the last
        // one that was ran. Functions always return the last
        // argument called
        return _.last(_.map(code, function(toRun) {
          return newGeneva.run(toRun);
        }));
      }
    });

    api.addFunc("defn", function(args) {
      var funcName = args[0],
          argNames = args[1],
          fnCode = args.slice(2),
          fn = api.run(["!fn", argNames].concat(fnCode));
      api.addFunc(funcName, fn);
    });

    api.addFunc("do", function(args) {
      return _.last(_.map(args, function(arg) {
        return api.run(arg);
      }));
    });

    // Math functions

    api.addFunc("inc", function(args) {
      var value = api.run(args[0]);
      return value + 1;
    });

    api.addFunc("+", function(args) {
      return _.reduce(args, function(total, arg) {
        var value = api.run(arg);
        return total + value;
      }, 0);
    });

    api.addFunc("-", function(args) {
      return _.reduce(args, function(total, arg) {
        var value = api.run(arg);
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
      var logic = api.run(args[0]);
      if (logic) {
        return api.run(args[1]);
      } else {
        if (args.length > 2) {
          return api.run(args[2]);
        }
        return null;
      }
    });

    // Functional functions

    api.addFunc("map", function(args) {
      var func = api.run(args[0]),
          values = api.run(args[1]);
      return _.map(values, function(value) {
        return func([value]);
      });
    });

    api.addFunc("reduce", function(args) {
      var func = api.run(args[0]),
          values = api.run(args[1]);
      return _.reduce(values, function(result, value) {
        return func([result, value]);
      });
    });
  }

  return api;
}