const http = require('http')


class Koa {
	constructor(){
		this.middleware = []
      this.ctx = {}
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
            if(this.ctx.body){
               res.write(this.ctx.body)
            }
            res.end()
         })
   	  }
   }

   _compose(req, res) {
      this.ctx = _createContext(req, res);
   	  let dispatch = i => Promise.resolve(this.middleware[i](ctx, () => dispatch(i + 1)))
        return dispatch(0)
   }

   _createContext(req, res){
       const ctx = Object.create({})
       ctx.req = req
       ctx.res = res
       return ctx
   }

}

module.exports = Koa