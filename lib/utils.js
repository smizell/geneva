var _ = require('lodash');

module.exports = {
  isFuncCall: function(code) {
    if (!Array.isArray(code)) return false;
    if (typeof code[0] !== "string") return false;
    if (code[0].charAt(0) == "!") return true;
    return false;
  },
  parseFunc: function(code) {
    return {
      name: this.getVarName(code[0]),
      args: code.slice(1)
    }
  },
  isVar: function(value) {
    if (typeof value !== "string") return false;
    if (value.charAt(0) === "~") return true;
    return false;
  },
  getVarName: function(varName) {
    return varName.slice(1)
  }
}