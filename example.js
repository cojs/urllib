var urllib = require('./');
var co = require('co');

urllib.TIME_OUT = 300;
urllib.agent.maxSockets = 10;

co(function *() {
  var result = yield urllib.request('http://baidu.com');
  var data = result[0]; // response data
  var res = result[1]; // response object
  console.log(res.statusCode);
})();
