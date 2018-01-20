const lodash = require('lodash');

module.exports = class Geneva {
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
  constructor() {
    // Global scope for entire runtime
    this.scope = new Scope();
  }

  run(code) {
    if (isRef(code)) {
      const ref = code.slice(1);
      return this.scope.getRef(ref);
    }
    if (!isCallable(code)) {
      if (lodash.isArray(code)) {
        return code.map(item => this.run(item));
      }
      return code;
    }
    const { fnName, args } = this.parseCode(code);
    const fn = this.scope.getRef(fnName);
    return fn(this, args);
  }

  parseCode(code) {
    // Function names start with a bang (!), so we strip it
    const [fnNameBang, ...args] = code;
    const fnName = fnNameBang.slice(1);
    return { fnName, args };
  }
}

const specialForms = {
  do(runtime, args) {
    const evaledArgs = args.map(arg => runtime.run(arg));
    return lodash.last(evaledArgs);
  },

  def(runtime, args) {
    const value = runtime.run(args[1]);
    runtime.scope.setRef(args[0], value);
    return value;
  },

  if(runtime, args) {
    const test = runtime.run(args[0]);
    if (test) {
      return runtime.run(args[1]);
    }
    if (args[2]) {
      return runtime.run(args[2]);
    }
    return null;
  },

  lambda(globalRuntime, lambdaArgs) {
    const argNames = lambdaArgs[0];

    return (parentRuntime, argValues) => {
      const runtime = new Runtime();
      runtime.scope.refs = {...globalRuntime.refs};
      const args = lodash.zip(argNames, argValues);
      args.forEach(arg => {
        runtime.scope.setRef(arg[0], arg[1]);
      });
      return runtime.run(lambdaArgs[1]);
    }
  }
};

class Scope {
  constructor() {
    // User-defined references
    this.refs = {};
  }

  getRef(refName) {
    if (specialForms[refName]) {
      return specialForms[refName];
    }

    if (this.refs[refName]) {
      return this.refs[refName];
    }

    if (lodash[refName]) {
      return (runtime, args) => {
        const evaledArgs = args.map(arg => runtime.run(arg));
        return lodash[refName](...evaledArgs);
      }
    }

    throw ReferenceError(`No reference '${refName}' found.`);
  }

  setRef(name, value) {
    this.refs[name] = value;
  }
}
