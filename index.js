/**!
 * co-urllib - index.js
 *
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

var urllib = require('urllib');
var thunkify = require('thunkify');
var _urllib = {};

Object.keys(urllib).forEach(function (key) {
  if (key === 'request') {
    return;
  }

  _urllib.__defineGetter__(key, function () {
    return urllib[key];
  });

  _urllib.__defineSetter__(key, function (val) {
    urllib[key] = val;
  });
});

_urllib.request = thunkify(urllib.request);

module.exports = _urllib;
