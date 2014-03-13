'use strict';

var co = require('co');
var urllib = require('./');

co(function *() {
  var result = yield urllib.request('http://baidu.com');
  var data = result.data; // response data
  var headers = result.headers; // response headers
  console.log(result.status, headers);
})();
