const http = require('http')
const Cookies = require('./cookies')

class Koa {
	constructor(){
		  this.middleware = []
      this.ctx = null
	}

   listen(num){
       return http.createServer(this._callback()).listen(num)
   }

   use(fn){
   	this.middleware.push(fn)
   }

   _callback() {
   	  return (req, res) => {
   	  	if (req.url !== '/favicon.ico') this._compose(req, res).then(()=> {
          let body = ''
            if(this.ctx.body){
             body = this.ctx.body.toString()
            }
           this.ctx.length = Buffer.byteLength(body);
          res.end(body);
         })
   	  }
   }

   _compose(req, res) {
      this.ctx = this.ctx || this._createContext(req, res);
      let ctx = this.ctx;
      ctx.path = req.url;

      let index = -1;
   	  let dispatch = i => {
        if(i<=index)return Promise.reject(new Error('next() called multiple times'))
        let fn = this.middleware[i]
        if(!fn)return Promise.resolve();
        try{
          return Promise.resolve(this.middleware[i](ctx, () => dispatch(i + 1)));
        }catch(err){
          return Promise.reject(err)
        }
      }
      return dispatch(0);
   }

   _createContext(req, res){
       const ctx = Object.create({})
       ctx.req = req
       ctx.res = res
       ctx.method = 'GET'
       ctx.body = ''
       ctx.cookies = new Cookies(req, res, {
        keys: 'koa'
       })
       return ctx
   }

}

module.exports = Koa