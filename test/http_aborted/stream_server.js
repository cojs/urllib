var http = require('http');
var fs = require('fs');

http.createServer(function (req, res) {
  res.setHeader('Content-Length', '213636');
  fs.createReadStream(__dirname + '/jade-1.2.0.tgz').pipe(res);
}).listen(1984);
