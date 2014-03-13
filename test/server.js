/**!
 * co-urllib - server.js
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

var koa = require('koa');
var sleep = require('co-sleep');
var middlewares = require('koa-middlewares');
var speeds = require('speeds');
var fs = require('fs');

var app = koa();
app.use(middlewares.bodyParser());

app.use(function *(next) {
  if (this.url === '/sleep') {
    yield sleep(1000);
  } else if (this.url === '/wrongjson') {
    return this.body = '{foo:bar}';
  } else if (this.url === '/json') {
    return this.body = {foo: 'bar'};
  } else if (this.url === '/destroy') {
    return this.res.destroy();
  } else if (this.url.indexOf('/qs') === 0) {
    return this.body = this.query;
  } else if (this.url.indexOf('/post') === 0) {
    return this.body = {
      body: this.request.body,
      'content-type': this.get('content-type'),
    };
  } else if (this.url === '/ua') {
    return this.body = {ua: this.get('user-agent')};
  } else if (this.url === '/direct') {
    return this.body = this.req;
  } else if (this.url === '/auth') {
    var auth = new Buffer(this.get('authorization').split(' ')[1], 'base64').toString().split(':');
    return this.body = {user: auth[0], pass: auth[1]};
  } else if (this.url === '/302') {
    this.status = 302;
    return this.redirect('/204');
  } else if (this.url === '/301') {
    this.status = 301;
    return this.redirect('/204');
  } else if (this.url === '/redirect_no_location') {
    this.status = 302;
    return this.body = 'I am 302 body';
  } else if (this.url === '/204') {
    this.status = 204;
    return;
  } else if (this.url === '/loop_redirect') {
    this.status = 302;
    return this.redirect('/loop_redirect');
  } else if (this.url === '/content-encoding') {
    this.set('content-encoding', 'foo');
    return this.body = new Buffer('bar');
  } else if (this.url === '/slow') {
    return this.body = fs.createReadStream(__filename).pipe(speeds(100));
  } else if (this.url === '/res-connection-end') {
    var res = this.res;
    setTimeout(function () {
      res.connection.end();
    }, 2000);
    return this.body = fs.createReadStream(__filename).pipe(speeds(100));
  } else if (this.url === '/socket.destroy') {
    var res = this.res;
    setTimeout(function () {
      res.destroy();
    }, 2000);
    return this.body = fs.createReadStream(__filename).pipe(speeds(100));
  }
});

module.exports = app;
