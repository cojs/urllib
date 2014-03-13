/**!
 * co-urllib - test/index.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var thunkify = require('thunkify');
var should = require('should');
var co = require('co');
var fs = require('fs');
var gunzip = thunkify(require('zlib').gunzip);
var urllib = require('../');
var app = require('./server');

describe('index.test.js', function () {
  var host = 'http://127.0.0.1:';
  var port = null;

  before(function (done) {
    app = app.listen(0, function () {
      host += app.address().port;
      done();
    });
  });

  describe('RequestError', function () {
    it('should return RequestError when server destroy connection', function (done) {
      co(function *() {
        try {
          var result = yield *urllib.request(host + '/destroy', {dataType: 'json'});
          done(new Error('should not run this'));
        } catch (e) {
          e.name.should.equal('RequestError');
          e.message.should.equal('socket hang up');
          done();
        }
      })();
    });
  });

  describe('options.beforeRequest', function () {
    it('should change headers before send', function (done) {
      co(function *() {
        var result = yield *urllib.request(host + '/ua', {
          dataType: 'json',
          beforeRequest: function (options) {
            options.headers['User-Agent'] = 'fooagent';
          }
        });
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(200);
        result.data.should.be.an.Object;
        result.data.should.eql({ua: 'fooagent'});
        result.headers['content-type'].should.equal('application/json');
        done();
      })();
    });
  });

  describe('options.agent = false, httpsAgent = false', function () {
    it('should work with http', function (done) {
      co(function *() {
        var result = yield *urllib.request(host + '/json', {dataType: 'json', agent: false});
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(200);
        result.data.should.be.an.Object;
        result.data.should.eql({foo: 'bar'});
        result.headers['content-type'].should.equal('application/json');
        done();
      })();
    });

    it('should work with https', function (done) {
      co(function *() {
        var result = yield *urllib.request('https://npmjs.org', {httpsAgent: false, timeout: 10000});
        result.should.have.keys('data', 'status', 'headers');
        result.data.should.be.a.Buffer;
        done();
      })();
    });
  });

  describe('header["user-agent"]', function () {
    it('should got default user-agent', co(function *() {
      var result = yield *urllib.request(host + '/ua', {
        dataType: 'json',
      });
      result.should.have.keys('data', 'status', 'headers');
      result.status.should.equal(200);
      result.data.should.be.an.Object;
      result.data.should.match({ua: /^node-co-urllib\/\d+\.\d+\.\d+ node\//});
      result.headers['content-type'].should.equal('application/json');
    }));

    it('should custom user-agent', function (done) {
      co(function *() {
        var result = yield *urllib.request(host + '/ua', {
          dataType: 'json',
          headers: {
            'user-agent': 'testua'
          }
        });
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(200);
        result.data.should.be.an.Object;
        result.data.should.eql({ua: 'testua'});
        result.headers['content-type'].should.equal('application/json');
        done();
      })();
    });
  });

  describe('options.rejectUnauthorized = ', function () {
    it('should ignore ssl check', function (done) {
      co(function *() {
        var result = yield *urllib.request('https://npmjs.org', {
          timeout: 10000,
          rejectUnauthorized: false,
        });
        result.should.have.keys('data', 'status', 'headers');
        // result.status.should.equal(200);
        result.data.should.be.a.Buffer;
        done();
      })();
    });
  });

  describe('options.auth = ', function () {
    it('should send with auth', function (done) {
      co(function *() {
        var result = yield *urllib.request(host + '/auth', {
          dataType: 'json',
          auth: 'foo:bar'
        });
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(200);
        result.data.should.be.an.Object;
        result.data.should.eql({user: 'foo', pass: 'bar'});
        result.headers['content-type'].should.equal('application/json');
        done();
      })();
    });
  });

  describe('options.writeStream = ', function () {
    it('should save data to stream', function (done) {
      co(function *() {
        var result = yield *urllib.request(host + '/json', {
          writeStream: fs.createWriteStream(__filename + '.out'),
        });
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(200);
        should.not.exist(result.data);
        fs.readFileSync(__filename + '.out', 'utf8').should.equal('{"foo":"bar"}');
        done();
      })();
    });
  });

  describe('options.stream = ', function () {
    it('should send with stream', function (done) {
      co(function *() {
        var result = yield *urllib.request(host + '/direct', {
          method: 'post',
          stream: fs.createReadStream(__filename),
        });
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(200);
        result.data.should.be.a.Buffer;
        result.data.toString().should.equal(fs.readFileSync(__filename, 'utf8'));
        result.headers['content-type'].should.equal('application/octet-stream');
        done();
      })();
    });
  });

  describe('options.content = ', function () {
    it('should send with buffer content', function (done) {
      co(function *() {
        var result = yield *urllib.request(host + '/direct', {
          method: 'post',
          dataType: 'json',
          content: new Buffer(JSON.stringify({nick: '苏千'})),
        });
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(200);
        result.data.should.be.an.Object;
        result.data.should.eql({nick: '苏千'});
        result.headers['content-type'].should.equal('application/octet-stream');
        done();
      })();
    });
  });

  describe('options.followRedirect = true', function () {
    it('should follow 302 redirect', function (done) {
      co(function *() {
        var result = yield *urllib.request(host + '/302', {
          followRedirect: true,
        });
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(204);
        should.not.exist(result.data);
        done();
      })();
    });

    it('should follow 301 redirect', function (done) {
      co(function *() {
        var result = yield *urllib.request(host + '/301', {
          followRedirect: true,
        });
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(204);
        should.not.exist(result.data);
        done();
      })();
    });

    it('should throw FollowRedirectError', function (done) {
      co(function *() {
        try {
          var result = yield *urllib.request(host + '/redirect_no_location', {
            followRedirect: true,
          });
          throw new Error('should not run this');
        } catch(e) {
          e.name.should.equal('FollowRedirectError');
          e.message.should.equal('Got statusCode 302 but cannot resolve next location from headers');
          done();
        }
      })();
    });

    it('should throw MaxRedirectError with default 10 max', function (done) {
      co(function *() {
        try {
          var result = yield *urllib.request(host + '/loop_redirect', {
            followRedirect: true,
          });
          throw new Error('should not run this');
        } catch(e) {
          e.name.should.equal('MaxRedirectError');
          e.message.should.include('Exceeded 10 maxRedirects. Probably stuck in a redirect loop');
          done();
        }
      })();
    });

    it('should throw MaxRedirectError with default 1 max', function (done) {
      co(function *() {
        try {
          var result = yield *urllib.request(host + '/loop_redirect', {
            followRedirect: true,
            maxRedirects: 1,
          });
          throw new Error('should not run this');
        } catch(e) {
          e.name.should.equal('MaxRedirectError');
          e.message.should.include('Exceeded 1 maxRedirects. Probably stuck in a redirect loop');
          done();
        }
      })();
    });
  });

  describe('options.data = ', function () {
    it('should get with querystring 1', function (done) {
      co(function *() {
        var result = yield *urllib.request(host + '/qs?k=name', {dataType: 'json', data: {nick: '苏千'}});
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(200);
        result.data.should.be.an.Object;
        result.data.should.eql({nick: '苏千', k: 'name'});
        result.headers['content-type'].should.equal('application/json');
        done();
      })();
    });

    it('should get with querystring 2', function (done) {
      co(function *() {
        var result = yield *urllib.request(host + '/qs', {dataType: 'json', data: {nick: '苏千'}});
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(200);
        result.data.should.be.an.Object;
        result.data.should.eql({nick: '苏千'});
        result.headers['content-type'].should.equal('application/json');
        done();
      })();
    });

    it('should post with form content', function (done) {
      co(function *() {
        var result = yield *urllib.request(host + '/post',
          {dataType: 'json', data: {nick: '苏千'}, method: 'POST'});
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(200);
        result.data.should.be.an.Object;
        result.data.should.eql({
          body: {nick: '苏千'},
          "content-type": "application/x-www-form-urlencoded"
        });
        result.headers['content-type'].should.equal('application/json');
        done();
      })();
    });

    it('should post with json content', function (done) {
      co(function *() {
        var result = yield *urllib.request(host + '/post',
          {
            dataType: 'json', data: {nick: '苏千'}, method: 'post',
            headers: {'content-type': 'application/json'}
          });
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(200);
        result.data.should.be.an.Object;
        result.data.should.eql({
          body: {nick: '苏千'},
          "content-type": "application/json"
        });
        result.headers['content-type'].should.equal('application/json');
        done();
      })();
    });
  });

  describe('options.dataType = json', function () {
    it('should got json', function (done) {
      co(function *() {
        var result = yield *urllib.request(host + '/json', {dataType: 'json'});
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(200);
        result.data.should.be.an.Object;
        result.data.should.eql({foo: 'bar'});
        result.headers['content-type'].should.equal('application/json');
        done();
      })();
    });

    it('should throw JSONResponseFormatError', function (done) {
      co(function *() {
        try {
          var result = yield *urllib.request(host + '/wrongjson', {dataType: 'json'});
          done(new Error('should not run this'));
        } catch (e) {
          e.name.should.equal('JSONResponseFormatError');
          done();
        }
      })();
    });
  });

  describe('options.timeout', function () {
    it('should throw ConnectionTimeoutError', function (done) {
      co(function *() {
        try {
          var result = yield *urllib.request(host + '/sleep', {timeout: 10});
          done(new Error('should not run this'));
        } catch (e) {
          e.status.should.equal(408);
          e.name.should.equal('ConnectionTimeoutError');
          e.message.should.equal('timeout of 10ms exceeded');
          done();
        }
      })();
    });

    it('should throw ResponseTimeoutError', function (done) {
      co(function *() {
        try {
          var result = yield *urllib.request(host + '/slow', {timeout: 2000});
          done(new Error('should not run this'));
        } catch (e) {
          should.exist(e);
          e.status.should.equal(408);
          e.name.should.equal('ResponseTimeoutError');
          e.message.should.equal('timeout of 2000ms exceeded');
          done();
        }
      })();
    });

    it('should throw RemoteSocketClosedError', function (done) {
      co(function *() {
        try {
          var result = yield *urllib.request(host + '/socket.destroy', {timeout: 20000});
          done(new Error('should not run this'));
        } catch (e) {
          should.exist(e);
          e.name.should.equal('RemoteSocketClosedError');
          e.message.should.equal('Remote socket was terminated before `response.end()` was called');
          done();
        }
      })();
    });

    it.skip('should throw mock res error', function (done) {
      co(function *() {
        try {
          var result = yield *urllib.request(host + '/res-connection-end', {timeout: 20000});
          done(new Error('should not run this'));
        } catch (e) {
          should.exist(e);
          // console.log(e)
          e.name.should.equal('RemoteSocketClosedError');
          e.message.should.equal('Remote socket was terminated before `response.end()` was called');
          done();
        }
      })();
    });
  });

  describe('options.gzip = true', function () {
    it('should get gzip response and auto decode it', function (done) {
      co(function *() {
        var result = yield *urllib.request('http://r.cnpmjs.org/byte', {
          dataType: 'json',
          gzip: true,
          timeout: 10000,
        });
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(200);
        result.data.should.be.a.Object;
        result.data.name.should.equal('byte');
        result.headers['content-type'].should.equal('application/json');
        result.headers['content-encoding'].should.equal('gzip');
        done();
      })();
    });

    it('should get gzip response and decode custom', function (done) {
      co(function *() {
        var result = yield *urllib.request('http://r.cnpmjs.org/byte', {
          dataType: 'json',
          gzip: true,
          timeout: 10000,
          headers: {
            'accept-encoding': 'gzip'
          }
        });
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(200);
        result.data.should.be.an.Buffer;
        result.data.length.should.above(0);
        result.headers['content-type'].should.equal('application/json');
        result.headers['content-encoding'].should.equal('gzip');
        var buf = yield gunzip(result.data);
        JSON.parse(buf).name.should.equal('byte');
        done();
      })();
    });

    it('should get response with content-encoding', function (done) {
      co(function *() {
        var result = yield *urllib.request(host + '/content-encoding', {
          dataType: 'json',
          gzip: true,
        });
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(200);
        result.data.should.be.an.Buffer;
        result.data.length.should.above(0);
        result.headers['content-encoding'].should.equal('foo');
        result.data.toString().should.equal('bar');
        done();
      })();
    });
  });

  describe('http and https web site', function () {
    it('should get http://nodejs.org success', function (done) {
      co(function *() {
        var result = yield *urllib.request('http://nodejs.org', {timeout: 10000});
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(200);
        result.data.should.be.a.Buffer;
        result.data.length.should.above(0);
        result.headers['content-type'].should.equal('text/html');
        // console.log(result.headers);
        done();
      })();
    });

    it('should get https://registry.npmjs.org success', function (done) {
      co(function *() {
        var result = yield *urllib.request('https://registry.npmjs.org', {dataType: 'json', timeout: 10000});
        result.should.have.keys('data', 'status', 'headers');
        result.status.should.equal(200);
        result.data.should.be.an.Object;
        result.data.db_name.should.equal('registry');
        // result.headers['content-type'].should.equal('application/json');
        // console.log(result)
        done();
      })();
    });
  });
});
