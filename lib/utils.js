module.exports.parseFunc = function(funcArray) {
  return {
    funcName: funcArray[0],
    args: funcArray.slice(1)
  }
}