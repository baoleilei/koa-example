
var express = require('express')
var app = express()

app.get('/', function (req, res) {
  sr = 'Hello World'
  try {
    setTimeout(function () {

      res.send(srs)
    }, 100)
  } catch (e) {
    console.log('try 捕获 异常', e)
  }

})

process.on('uncaughtException', function (err) {
  console.error('uncaughtException', err);

  server.on('request', (req, res) => {
    console.log('拦截用户请求')
    req.shouldKeepAlive = false;
    res.shouldKeepAlive = false;
    if (!res._header) {
      res.setHeader('Connection', 'close');
    }

    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('server internal error');
  })
});

const server = app.listen(3001)