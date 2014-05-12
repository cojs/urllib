var http = require('http');
var fs = require('fs');

var path = '/tmp/a.tgz';

var l = 0;

function request() {
  var index = l++;
  var stream = fs.createWriteStream(path);
  var url = 'http://127.0.0.1:1984/jade/download/jade-1.2.0.tgz?index=' + index;
  console.log('--------------------');
  console.log('node version: %s', process.version);
  var req = http.request(url, function (res) {
    var aborted = false;
    console.log('req got %s response', res.statusCode);
    // console.log(res.statusCode, res.headers);
    res.pipe(stream);
    stream.on('finish', function () {
      console.log('stream finish');
    });
    stream.on('close', function () {
      console.log('stream close');
      console.log('stream size:', fs.statSync(path).size, res.headers['content-length'], res.statusCode);
      if (aborted) {
        process.exit(1);
      }
      request();
    });

    var size = 0;
    res.on('data', function (data) {
      size += data.length;
      console.log('res data %s/%s', size, res.headers['content-length']);
    });

    res.on('end', function () {
      console.log('res size:', size, res.headers['content-length'], res.statusCode);
      console.log('res end');
    });

    res.on('aborted', function () {
      aborted = true;
      console.log('%s, res aborted!!!!!!!!!!!!!!!!', index);
    });
    res.on('close', function () {
      console.log('res close');
    });
  });

  req.on('socket', function (socket) {
    console.log('req got a socket');
    socket.on('agentRemove', function () {
      console.log('req.socket agentRemove');
    });

    socket.on('close', function () {
      console.log('req.socket close');
    });

    var size = 0;

    socket.on('end', function () {
      console.log('req.socket end, size: %s', size);
    });

    socket.on('data', function (data) {
      size += data.length;
      console.log('req.socket data %s', size);
    });
  });

  req.on('close', function () {
    console.log('req close');
  });

  req.end();
}

var bigbuffer = new Buffer(1024 * 1024);
http.createServer(function (req, res) {
  res.setHeader('Content-Length', bigbuffer.length);
  res.end(bigbuffer);
}).listen(1984, request);
