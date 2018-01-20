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

class Runtime {
  constructor() {
    this.scope = new Scope();
  }

  run(code) {
    if (!isCallable(code)) return code;
    const { fnName, args } = this.parseCode(code);
    const fn = this.scope.getFn(fnName);
    const evaledArgs = args.map(arg => this.run(arg));
    return fn(this)(...evaledArgs);
  }

  parseCode(code) {
    // Function names start with a bang (!), so we strip it
    const [fnNameBang, ...args] = code;
    const fnName = fnNameBang.slice(1);
    return { fnName, args };
  }
}

class Scope {
  getFn(fnName) {
    if (lodash[fnName]) return () => lodash[fnName];
    throw ReferenceError(`No function ${fnName} found.`);
  }
}