const R = require("ramda");
const RA = require("ramda-adjunct");

class Geneva {
  constructor(options = {}) {
    this.initial = options.initial || {};
    this.forms = options.forms || {};
    this.initial = options.initial || {};
    this.forms = options.forms || {};
    this.parser = options.parser || new Parser();
    this.standardLib = options.standardLib || R;
  }

  // Builds a runtime from the initial options
  buildRuntime(givenScope) {
    const scope =
      givenScope || new Scope(this.initial, this.forms, this.standardLib);
    const runtime = new Runtime(scope, this.parser);
    return runtime;
  }

  run(code) {
    const runtime = this.buildRuntime();
    return runtime.run(code);
  }
}

class Runtime {
  constructor(scope, parser) {
    // Global scope for entire runtime
    this.scope = scope || new Scope();
    this.parser = parser || new Parser();
  }

  run(code) {
    if (this.parser.isRef(code)) {
      const refName = this.parser.getRefName(code);
      return this.scope.getRef(refName);
    }

    if (this.parser.isCallable(code)) {
      const { fnName, args } = this.parser.parseCode(code);
      const fn = this.scope.getRef(fnName);

      // Functions can either be Form objects that wrap runtimes or they can be
      // actual functions. The Form class allow us to pass around the runtime so functions can use the runtime during a function call.
      if (fn instanceof Form) {
        return fn.run(this, args);
      }

      // Functions allow for interacting with normal JavaScript code This is
      // mostly used by the lambda special form
      if (RA.isFunction(fn)) {
        const values = args.map(this.run.bind(this));
        return fn(...values);
      }
    }

    // Arrays with the first item as a function should be called by passing all
    // of the items after the function as arguments. This is so lambdas can be
    // defined and called directly.
    if (RA.isArray(code)) {
      const arr = code.map((item) => this.run(item));

      if (RA.isFunction(arr[0])) {
        return arr[0](...arr.slice(1));
      }

      return arr;
    }

    // Even objects can have code nested within them. However, order of
    // operation can't really be guaranteed.
    if (RA.isPlainObject(code)) {
      return R.reduce(
        (memo, [key, value]) => {
          memo[key] = this.run(value);
          return memo;
        },
        {},
        R.toPairs(code)
      );
    }

    // If we made it this far, it's just a normal value so we can return it.
    // This will work for numbers, strings, booleans, or any code that has
    // already been evaluated.
    return code;
  }
}

class Parser {
  // Code that is callable looks like ['!fn', 'arg1', 'arg2']
  isCallable(code) {
    return code && RA.isArray(code) && code.length > 0 && code[0][0] == "!";
  }

  // References look like ~x
  isRef(code) {
    return code && RA.isString(code) && code[0] == "~";
  }

  // References start with ~, so we need to trim off that first character
  // here. That will give us the variable name.
  getRefName(code) {
    return code.slice(1);
  }

  // Function names start with a bang (!), so we strip it
  parseCode(code) {
    const [fnNameBang, ...args] = code;
    const fnName = fnNameBang.slice(1);
    return { fnName, args };
  }
}

// Used to wrap a function for later
class Form {
  constructor(fn) {
    this.fn = fn;
  }

  run(runtime, args) {
    return this.fn(runtime, args);
  }
}

const defaultForms = {
  do: new Form((runtime, args) => {
    const evaledArgs = args.map((arg) => runtime.run(arg));
    return R.last(evaledArgs);
  }),

  def: new Form((runtime, args) => {
    const value = runtime.run(args[1]);
    runtime.scope.setRef(args[0], value);
    return value;
  }),

  if: new Form((runtime, args) => {
    const test = runtime.run(args[0]);
    if (test) {
      return runtime.run(args[1]);
    }
    if (args[2]) {
      return runtime.run(args[2]);
    }
    return null;
  }),

  lambda: new Form((parentRuntime, lambdaArgs) => {
    const argNames = lambdaArgs[0];
    // We create a copy of the scope when the lambda is created
    // We don't want this scope to change
    const frozenScope = parentRuntime.scope.copy();

    return (...args) => {
      // We create a new copy when we run the function
      // We don't want this function to affect other scopes
      const scope = frozenScope.copy();

      // Add the passed arguments into the scope
      R.forEach(([index, value]) => {
        scope.setRef(argNames[index], value);
      }, R.toPairs(args.slice(0, argNames.length)));

      const runtime = new Runtime(scope, parentRuntime.parser);
      const results = R.map((expr) => {
        return runtime.run(expr);
      }, lambdaArgs.slice(1));

      return R.last(results);
    };
  }),

  defn: new Form((runtime, args) => {
    // Rewrite the function as a def call for simplicity
    return runtime.run(["!def", args[0], ["!fn", args[1], args[2]]]);
  }),

  quote: new Form((runtime, args) => {
    // We don't run the code for quote, we just pass it through like it's normal
    // code
    return args[0];
  }),

  eval: new Form((runtime, args) => {
    // Evaluate quoted code
    const code = runtime.run(args[0]);
    return runtime.run(code);
  }),

  readString: new Form((runtime, args) => {
    return runtime.run(["!quote", JSON.parse(args[0])]);
  }),
};

// Alias lambda as fn for fun
defaultForms["fn"] = defaultForms["lambda"];

class Scope {
  constructor(refs = {}, forms = {}, standardLib = {}) {
    // User-defined references
    this.refs = refs;

    // Special forms passed in at load time
    this.forms = R.reduce(
      (memo, [key, value]) => {
        memo[key] = new Form(value);
        return memo;
      },
      {},
      R.toPairs(forms)
    );

    this.standardLib = standardLib;
  }

  copy() {
    return new Scope(R.clone(this.refs), R.clone(this.forms), this.standardLib);
  }

  getRef(refName) {
    // First look for special forms so users can't overwrite them
    if (defaultForms[refName]) {
      return defaultForms[refName];
    }

    // This is the user-defined space
    if (this.refs[refName]) {
      return this.refs[refName];
    }

    // User-defined special forms at load time
    if (this.forms[refName]) {
      return this.forms[refName];
    }

    if (this.standardLib[refName]) {
      return new Form((runtime, args) => {
        const evaledArgs = args.map((arg) => runtime.run(arg));
        return this.standardLib[refName](...evaledArgs);
      });
    }

    throw ReferenceError(`No reference '${refName}' found.`);
  }

  setRef(name, value) {
    this.refs[name] = value;
  }
}

module.exports = {
  Geneva,
  Runtime,
  Scope,
  Parser,
  Form,
  defaultForms,
};
