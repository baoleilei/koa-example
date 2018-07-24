const koa = require('koa')
const logger  = require('./middleware/logger')

const app = new koa()
app.listen(3001)
console.log('[demo] koa start at port 3001')


app.use(logger())

app.use(function (ctx, next) {
    ctx.body = 'Hello Koa';
})

