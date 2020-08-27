const R = require("ramda");
const RA = require("ramda-adjunct");
const immer = require("immer");
const YAML = require("yaml");
const Mustache = require("mustache");

const regex = {
  create: (pattern, flags) => new RegExp(pattern, flags),
  test: (re, str) => re.test(str),
};

const defaultLibraries = [
  R,
  RA,
  // These are libraries we want to name space
  {
    jq: require("jsonpath"),
    saunter: require("saunter"),
    regex,
  },
];

class Geneva {
  constructor(options = {}) {
    this.initial = options.initial || {};
    this.forms = options.forms || {};
    this.parser = options.parser || new ObjectParser();
    this.libraries = options.libraries || defaultLibraries;
    this.fs = options.fs || {};
  }

  static withObjectParser(options = {}) {
    options.parser = new ObjectParser();
    return new Geneva(options);
  }

  static withArrayParser(options = {}) {
    options.parser = new ArrayParser();
    return new Geneva(options);
  }

  // Builds a runtime from the initial options
  buildRuntime(givenScope) {
    const scope =
      givenScope || new Scope(this.initial, this.forms, this.libraries);
    const runtime = new Runtime(scope, this.parser, this.fs);
    return runtime;
  }

  run(code) {
    const runtime = this.buildRuntime();
    return runtime.run(code);
  }
}

class Runtime {
  constructor(scope, parser, fs) {
    // Global scope for entire runtime
    this.scope = scope || new Scope();
    this.parser = parser || new DefaultParser();
    this.fs = fs;
  }

  run(code) {
    if (this.parser.isRef(code)) {
      const refName = this.parser.getRefName(code);
      return this.scope.getRef(refName);
    }

    if (this.parser.isCallable(code)) {
      const { fnName, args } = this.parser.parseCode(code);
      const fn = this.scope.getRef(fnName);

      // Functions allow for interacting with normal JavaScript code This is
      // mostly used by the lambda special form
      if (RA.isFunction(fn)) {
        if (fn.isForm) {
          return fn(this, args);
        }
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
    // TODO: this can be a map instead
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

class ArrayParser {
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

function formWrapper(fn) {
  fn.isForm = true;
  return fn;
}

const defaultForms = {
  do: formWrapper((runtime, args) => {
    const evaledArgs = args.map((arg) => runtime.run(arg));
    return R.last(evaledArgs);
  }),

  def: formWrapper((runtime, args) => {
    const value = runtime.run(args[1]);
    runtime.scope.setRef(args[0], value);
    return value;
  }),

  if: formWrapper((runtime, args) => {
    const test = runtime.run(args[0]);
    if (test) {
      return runtime.run(args[1]);
    }
    if (args[2]) {
      return runtime.run(args[2]);
    }
    return null;
  }),

  lambda: formWrapper((parentRuntime, lambdaArgs) => {
    const argNames = lambdaArgs[0];
    // We create a copy of the scope when the lambda is created
    // We don't want this scope to change
    const frozenScope = parentRuntime.scope.copy();

    return (...args) => {
      // We create a new copy when we run the function
      // We don't want this function to affect other scopes
      const scope = frozenScope.copy();

      // Add the passed arguments into the scope
      // TODO: set refs all at once since using immer
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

  defn: formWrapper((runtime, args) => {
    // Rewrite the function as a def call for simplicity
    // TODO: this is coupled to the syntax
    return runtime.run({
      "fn:def": [
        args[0],
        {
          "fn:lambda": [args[1], args[2]],
        },
      ],
    });
    // return runtime.run(["!def", args[0], ["!fn", args[1], args[2]]]);
  }),

  quote: formWrapper((runtime, args) => {
    // We don't run the code for quote, we just pass it through like it's normal
    // code
    return args[0];
  }),

  eval: formWrapper((runtime, args) => {
    // Evaluate quoted code
    const code = runtime.run(args[0]);
    return runtime.run(code);
  }),

  readString: formWrapper((runtime, args) => {
    // TODO: this is broken
    return runtime.run(["!quote", JSON.parse(args[0])]);
  }),

  template: formWrapper((runtime, args) => {
    let arg;
    // We'll allow an array or string
    if (RA.isString(args)) {
      arg = args;
    } else {
      arg = args[0];
    }
    // We run the first arg in case there is code in there
    const value = runtime.run(arg);
    return Mustache.render(value, runtime.scope.refs);
  }),

  templateFile: formWrapper((runtime, arg) => {
    const filePath = runtime.run(arg);
    const template = runtime.fs.readFileSync(filePath, "utf-8");
    return Mustache.render(template, runtime.scope.refs);
  }),

  include: formWrapper((runtime, arg) => {
    const filePath = runtime.run(arg);
    console.log("fasdf");
    const code = runtime.fs.readFileSync(filePath, "utf-8");
    return runtime.run(YAML.parse(code));
  }),

  readFile: formWrapper((runtime, arg) => {
    const filePath = runtime.run(arg);
    return runtime.fs.readFileSync(filePath, "utf-8");
  }),
};

// Alias lambda as fn for fun
defaultForms["fn"] = defaultForms["lambda"];

class Scope {
  constructor(refs = {}, forms = {}, libraries = {}) {
    // User-defined references
    this.refs = refs;

    // Special forms passed in at load time
    this.forms = R.pipe(
      R.toPairs,
      R.map(([key, value]) => [key, formWrapper(value)]),
      R.fromPairs
    )(forms);

    this.libraries = libraries;
  }

  copy() {
    return new Scope(this.refs, this.forms, this.libraries);
  }

  getRef(refName) {
    let value;

    // Allow paths specified with periods
    const parts = R.split(".", refName);

    value = R.path(parts, defaultForms);
    if (value !== undefined) return value;

    value = R.path(parts, this.refs);
    if (value !== undefined) return value;

    value = R.path(parts, this.forms);
    if (value !== undefined) return value;

    for (let i = 0; i < this.libraries.length; i++) {
      value = R.path(parts, this.libraries[i]);
      if (value !== undefined) return value;
    }

    throw ReferenceError(`No reference '${refName}' found.`);
  }

  setRef(name, value) {
    this.refs = immer.produce(this.refs, (draft) => {
      draft[name] = value;
    });
  }
}

class ObjectParser {
  constructor({ functionPrefix = "fn:", codePrefix = "ref:" } = {}) {
    this.functionPrefix = functionPrefix;
    this.codePrefix = codePrefix;
  }

  // References look like ~x
  isRef(code) {
    return code && RA.isString(code) && code.startsWith(this.codePrefix);
  }

  // References start with ~, so we need to trim off that first character
  // here. That will give us the variable name.
  getRefName(code) {
    return code.slice(this.codePrefix.length);
  }

  isCallable(code) {
    if (RA.isPlainObject(code)) {
      const keys = R.keys(code);
      return (
        keys.length === 1 &&
        RA.isString(keys[0]) &&
        keys[0].startsWith(this.functionPrefix)
      );
    }
    return false;
  }

  // Function names start with a bang (!), so we strip it
  parseCode(code) {
    const fnWithChar = R.keys(code)[0];
    const args = code[fnWithChar];
    const fnName = fnWithChar.slice(this.functionPrefix.length);
    return { fnName, args };
  }
}

class ConfigBuilder {
  constructor({ config, initial = {}, forms = {}, fs } = {}) {
    this.config = config;
    this.geneva = new Geneva({ initial, forms, fs });
  }

  static fromYAML(yamlConfig) {
    return new ConfigBuilder({ config: YAML.parse(yamlConfig) });
  }

  build(parameters) {
    const runtime = this.geneva.buildRuntime();

    // Check given parameters against checks if they exist
    R.forEach(({ name, check }) => {
      if (check === undefined) return;
      // We allow the person to reference a check or create their own
      // We pass it into the runtime to get it back out
      const checker = runtime.run(check);
      if (!RA.isFunction(checker)) {
        throw TypeError(`Check for ${name} must be a function`);
      }
      if (!checker(parameters[name])) throw TypeError("Wrong Type");
    }, this.config.parameters);

    // Check required fields
    R.pipe(
      R.filter(({ required }) => required === true),
      R.forEach(({ name }) => {
        if (!(name in parameters)) {
          throw TypeError(`Parameter ${name} is required`);
        }
      })
    )(this.config.parameters);

    // Load parameters into runtime
    R.pipe(
      R.toPairs,
      R.forEach(([key, value]) => {
        runtime.run({
          "fn:def": [key, value],
        });
      })
    )(parameters);

    // Compute computed properties
    R.forEach(({ name, compute }) => {
      runtime.run({
        "fn:def": [name, compute],
      });
    }, this.config.computed);

    return () => {
      return runtime.run(this.config.definition);
    };
  }

  run(parameters) {
    const runner = this.build(parameters);
    return runner();
  }
}

module.exports = {
  Geneva,
  Runtime,
  Scope,
  ArrayParser,
  ObjectParser,
  ConfigBuilder,
  defaultForms,
  defaultLibraries,
};
