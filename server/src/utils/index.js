const {uuid} = require('./uuid');

const isFunction = (func) => {
  return func && typeof func === 'function';
};

module.exports = {uuid, isFunction};