const koa = require('koa')

const app = new koa()
app.listen(3001)
console.log('[demo] koa start at port 3001')

app.use((ctx)=>{
  

  try{
  	 setTimeout(function(){;
  	ctx.body=str;
  },100)
  }catch(e){
   console.log('catch', e)
  }
  // ctx.throw(500);
})
app.on("error",(err,ctx)=>{
   console.log(new Date(),":",err);
});

process.on('uncaughtException', function (err) {
  console.error('uncaught e', err);
});