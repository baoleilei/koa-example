const ms = require('ms')
const http = require('http');

class Daemons {
	constructor(opts){
        this.server = opts.server;
        this.onError = opts.error;
        this.killTimeout = ms(opts.killTimeout || '20s') //https://github.com/zeit/ms

        this.errorNum = 0;

        if(!(this.server instanceof http.Server)){
        	console.error('this server is not Server instance')
        	return;
        }
        this._startCatchError();
	}

	_startCatchError(){
        process.on('uncaughtException',  (err) => {	  
           this.errorNum += 1;

           this.onError.call(this.server, err);
           
           console.error(err);
           // 输出堆栈错误
           console.error(err.stack);

           //拦截用户请求 
           this.server.on('request', (req, res) => {
           	   //关闭长链接
           	   req.shouldKeepAlive = false;
	           res.shouldKeepAlive = false;
	           if (!res._header) {
	              res.setHeader('Connection', 'close');
	           }
               // 返回用户内部服务错误
	           res.writeHead(500, { 'Content-Type': 'text/plain' });
               res.end('server internal error');
           })

           // set timeout once
           if(this.errorNum > 1)return;
           setTimeout(()=>{
           	  console.error(`timeout kill pid ${process.pid} and exit now`);
           	  process.exit(1);
           }, this.killTimeout)
		});
	}
}

module.exports = Daemons;