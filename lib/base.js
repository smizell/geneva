const lodash = require('lodash');

module.exports = class Geneva {
  run(code) {
      const [fnNameBang, ...args] = code;
      const fnName = fnNameBang.slice(1);
      const fn = lodash[fnName];
      const output = fn(...args);
      return { output: output };
  }
};