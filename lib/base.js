const lodash = require('lodash');

module.exports = class Geneva {
  // The main interface to the runtime
  run(code) {
    const runtime = new Runtime();
    return runtime.run(code);
  }
};

function isCallable(code) {
  // Code that is callable looks like ['!fn', 'arg1', 'arg2']
  return code && lodash.isArray(code) && code[0][0] == '!';
}

function isRef(code) {
  // References look like ~x
  return code && lodash.isString(code) && code[0] == '~'
}

class Runtime {
  constructor(scope) {
    // Global scope for entire runtime
    this.scope = scope || new Scope();
  }

  run(code) {
    if (isRef(code)) {
      const ref = code.slice(1);
      return this.scope.getRef(ref);
    }

    if (!isCallable(code)) {
      if (lodash.isArray(code)) {
        const arr = code.map(item => this.run(item));

        // Arrays with the first item as a function should be called by passing
        // all of the items after the function as arguments. This is so lambdas
        // can be defined and called directly.
        if (lodash.isFunction(arr[0])) {
          return arr[0](...arr.slice(1));
        }
        return arr;
      }

      if (lodash.isPlainObject(code)) {
        return lodash.reduce(code, (memo, value, key) => {
          memo[key] = this.run(value);
          return memo;
        }, {});
      }

      return code;
    }

    const { fnName, args } = this.parseCode(code);
    const fn = this.scope.getRef(fnName);

    // Functions can either be runners that wrap runtimes or they can be actual
    // functions. Runners allow us to pass around the runtime.
    if (fn instanceof Runner) {
      return fn.run(this, args);
    }

    // Functions allow for interacting with normal JavaScript code This is
    // mostly used by the lambda special form
    if (lodash.isFunction(fn)) {
      return fn(...args);
    }
  }

  parseCode(code) {
    // Function names start with a bang (!), so we strip it
    const [fnNameBang, ...args] = code;
    const fnName = fnNameBang.slice(1);
    return { fnName, args };
  }
}

// Used to wrap a function for later
class Runner {
  constructor(fn) {
    this.fn = fn;
  }

  run(runtime, args) {
    return this.fn(runtime, args);
  }
}

const specialForms = {
  do: new Runner((runtime, args) => {
    const evaledArgs = args.map(arg => runtime.run(arg));
    return lodash.last(evaledArgs);
  }),

  def: new Runner((runtime, args) => {
    const value = runtime.run(args[1]);
    runtime.scope.setRef(args[0], value);
    return value;
  }),

  if: new Runner((runtime, args) => {
    const test = runtime.run(args[0]);
    if (test) {
      return runtime.run(args[1]);
    }
    if (args[2]) {
      return runtime.run(args[2]);
    }
    return null;
  }),

  lambda: new Runner((parentRuntime, lambdaArgs) => {
    const argNames = lambdaArgs[0];
    // Store the refs to freeze the scope. This permits functions from accessing
    // variables after the function has been defined.
    const storedRefs = {...parentRuntime.scope.refs};

    // Each function call gets its own run time with its own scope
    return (...args) => {
      const scope = new Scope(storedRefs);
      lodash.forEach(args, (value, index) => {
        // Make sure we don't go beyond the arguments
        if (index + 1 <= args.length) {
          scope.setRef(argNames[index], value)
        }
      })
      const runtime = new Runtime(scope);
      return runtime.run(lambdaArgs[1]);
    }
  }),

  quote: new Runner((runtime, args) => {
    // We don't run the code for quote, we just pass it through like it's normal
    // code
    return args[0];
  })
};

// Alias lambda as fn for fun
specialForms['fn'] = specialForms['lambda'];


class Scope {
  constructor(refs = {}) {
    // User-defined references
    this.refs = refs;
  }

  getRef(refName) {
    // First look for special forms so users can't overwrite them
    if (specialForms[refName]) {
      return specialForms[refName];
    }

    // This is the user-defined space
    if (this.refs[refName]) {
      return this.refs[refName];
    }

    // Lodash is the default standard library
    if (lodash[refName]) {
      return new Runner((runtime, args) => {
        const evaledArgs = args.map(arg => runtime.run(arg));
        return lodash[refName](...evaledArgs);
      });
    }

    throw ReferenceError(`No reference '${refName}' found.`);
  }

  setRef(name, value) {
    this.refs[name] = value;
  }
};
