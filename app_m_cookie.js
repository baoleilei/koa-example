const Koa = require('./modules/koa')
const Route  = require('./modules/route')

const app = new Koa()
const route = new Route();

app.listen(3001)
console.log('[demo] koa start at port 3001')

const data = [
    {name: 'jack', age: 12},
    {name: 'mali', age: 34}
]

app.use(route.get('/person', (ctx) => {
    ctx.cookies.set('koa_cookies', 'test')
    ctx.body = data;
}))
