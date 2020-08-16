#! /usr/bin/env node

const fs = require("fs");
const path = require("path");
const util = require("util");
const YAML = require("yaml");
const { program } = require("commander");
const { repl } = require("./repl");
const { ConfigBuilder, Geneva } = require("../lib/base");

program.version("0.1.0");

program.command("repl").action(function () {
  repl();
});

program
  .command("definition <defPath> <paramPath>")
  .action(function (defPath, paramPath) {
    const defFile = fs.readFileSync(path.resolve(defPath), "utf-8");
    const paramFile = fs.readFileSync(path.resolve(paramPath), "utf-8");
    const config = new ConfigBuilder({ config: YAML.parse(defFile) });
    const run = config.build(YAML.parse(paramFile));
    const result = run();
    console.log(util.inspect(result, false, null, true /* enable colors */));
  });

program.command("run <codeFilePath>").action(function (codeFilePath) {
  const code = fs.readFileSync(path.resolve(codeFilePath), "utf-8");
  const geneva = Geneva.withObjectParser();
  const runtime = geneva.buildRuntime();
  console.log(runtime.run(YAML.parse(code)));
});

program.parse(process.argv);
