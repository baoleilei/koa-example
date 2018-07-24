module.exports = function () {
  return async function ( ctx, next ) {
    try {
    	await next();
    }catch(e){
       response.status = err.statusCode || err.status || 500;
       ctx.body = {
       	  msg: e.messaage
       }
    }
  }
}