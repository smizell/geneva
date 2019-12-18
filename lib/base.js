const lodash = require('lodash');

class Geneva {
  constructor(options = {}) {
    this.initial = options.initial || {};
    this.forms = options.forms || {};
  }

  run(code) {
    const scope = new Scope(this.initial, this.forms);
    const runtime = new Runtime(scope);
    return runtime.run(code);
  }

  // Allows users to build their own runtime and use it for testing purposes or
  // integrating with other code.
  buildRuntime(options = {}) {
    const initial = options.initial || {};
    const forms = options.forms || {};
    const parser = options.parser || new Parser();
    const scope = new Scope(initial, forms);
    return new Runtime(scope, parser);
  }
};

class Runtime {
  constructor(scope, parser) {
    // Global scope for entire runtime
    this.scope = scope || new Scope();
    this.parser = parser || new Parser();
  }

  run(code) {
    // References start with ~, so we need to trim off that first character
    // here. That will give us the variable name.
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
      if (lodash.isFunction(fn)) {
        const values = args.map(this.run.bind(this));
        return fn(...values);
      }
    }

    // Arrays with the first item as a function should be called by passing all
    // of the items after the function as arguments. This is so lambdas can be
    // defined and called directly.
    if (lodash.isArray(code)) {
      const arr = code.map(item => this.run(item));

      if (lodash.isFunction(arr[0])) {
        return arr[0](...arr.slice(1));
      }

      return arr;
    }

    // Even objects can have code nested within them. However, order of
    // operation can't really be guaranteed.
    if (lodash.isPlainObject(code)) {
      return lodash.reduce(code, (memo, value, key) => {
        memo[key] = this.run(value);
        return memo;
      }, {});
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
    return code && lodash.isArray(code) && code.length > 0 && code[0][0] == '!';
  }

  isRef(code) {
    // References look like ~x
    return code && lodash.isString(code) && code[0] == '~'
  }

  getRefName(code) {
    return code.slice(1)
  }

  parseCode(code) {
    // Function names start with a bang (!), so we strip it
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
    const evaledArgs = args.map(arg => runtime.run(arg));
    return lodash.last(evaledArgs);
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
    // Store the refs to freeze the scope. This permits functions from accessing
    // variables after the function has been defined.
    const storedRefs = lodash.cloneDeep(parentRuntime.scope.refs);
    const storedForms = lodash.cloneDeep(parentRuntime.scope.forms);

    // Each function call gets its own run time with its own scope
    return (...args) => {
      const refs = lodash.cloneDeep(storedRefs);
      const forms = lodash.cloneDeep(storedForms);
      const scope = new Scope(refs, forms);

      // Add the passed arguments into the scope
      lodash.forEach(args.slice(0, argNames.length), (value, index) => {
        scope.setRef(argNames[index], value)
      });

      const runtime = new Runtime(scope);
      return runtime.run(lambdaArgs[1]);
    }
  }),

  defn: new Form((runtime, args) => {
    // Rewrite the function as a def call for simplicity
    return runtime.run(
      ['!def', args[0],
        ['!fn', args[1], args[2]]]);
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
    return runtime.run(['!quote', JSON.parse(args[0])]);
  }),
};

// Alias lambda as fn for fun
defaultForms['fn'] = defaultForms['lambda'];

class Scope {
  constructor(refs = {}, forms = {}, standardLib) {
    // User-defined references
    this.refs = refs;

    // Special forms passed in at load time
    this.forms = lodash.reduce(forms, (memo, value, key) => {
      memo[key] = new Form(value);
      return memo;
    }, {});

    this.standardLib = standardLib || lodash;
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

    // Lodash is the default standard library
    if (this.standardLib[refName]) {
      return new Form((runtime, args) => {
        const evaledArgs = args.map(arg => runtime.run(arg));
        return this.standardLib[refName](...evaledArgs);
      });
    }

    throw ReferenceError(`No reference '${refName}' found.`);
  }

  setRef(name, value) {
    this.refs[name] = value;
  }
};

module.exports = {
  Geneva,
  Runtime,
  Scope,
  Parser,
  Form,
  defaultForms
}
