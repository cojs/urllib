/**!
 * co-urllib - test/callback.test.js
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

var co = require('co');
var should = require('should');
var urllib = require('../build/urllib');

var request = co(urllib.request);

describe('callback.test.js', function () {
  it('should get http://nodejs.org success', function (done) {
    request('http://nodejs.org', {timeout: 10000}, function (err, result) {
      should.not.exist(err);
      result.should.have.keys('data', 'status', 'headers');
      result.status.should.equal(200);
      result.data.should.be.a.Buffer;
      result.data.length.should.above(0);
      if (result.headers['content-length']) {
        result.data.should.length(+result.headers['content-length']);
      }
      result.headers['content-type'].should.equal('text/html');
      done();
    });
  });
});
