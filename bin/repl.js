#! /usr/bin/env node

const repl = require("repl");
const Geneva = require('../lib/base');

const geneva = new Geneva();
let runtime = geneva.buildRuntime();

const replServer = repl.start({
  prompt: "geneva> ",
  eval: genevaEval
});

replServer.defineCommand('reset', {
  help: 'Reset the runtime',
  action(name) {
    runtime = geneva.buildRuntime();
    console.log('Runtime reset');
    this.displayPrompt();
  }
});

replServer.defineCommand('refs', {
  help: 'View the current references',
  action(name) {
    console.log(runtime.scope.refs);
    this.displayPrompt();
  }
});

function genevaEval(cmd, context, filename, callback) {
  return callback(null, runtime.run(eval(cmd)));
}