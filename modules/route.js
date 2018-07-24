const pathToRegexp = require('path-to-regexp');

class Route {
	constructor(opts){
		this.opts = opts || {}
		this.methods = [
		'get',
	    'post'
		]

		this.methods.forEach((method) =>{
            this[method] = (path, fn) => {
                return this._create(path, method, fn)
            }
		})
	}

	_create (path, method, fn) {       

        let keys = []
 		let regxp = pathToRegexp(path, keys);

        method = method.toUpperCase();
       
        return (ctx, next) => {
             if(!this._matches(ctx, method)) return next();
             console.log('ctx.path is', ctx.path)
             console.log('ctx.method is', ctx.method)
             //regxp.exec('/person/jack') => [ '/person/jack', 'jack', index: 0, input: '/person/jack' ]
             let matchs = regxp.exec(ctx.path)
             console.log('matchs is', matchs)
             if(matchs){
             	let args = matchs.slice(1)
             	ctx.routePath = path;
             	args.unshift(ctx);
		        args.push(next);
		        return Promise.resolve(fn.apply(ctx, args));
             }

             return next();
        }
	}

	_matches(ctx, method) {
        if(ctx.method === method)return true;
        if(method === 'GET' && ctx.method === 'HEAD')return true;
        return false;
	}
}

module.exports = Route