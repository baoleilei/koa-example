const Koa = require('koa')
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
    ctx.body = data;
}))

app.use(route.get('/person/:name', (ctx, name) => {
    let res;
    data.forEach(d=>{
        if(d.name == name){
            res = d;
        }
    })
    if(!res){
        res = "don't find"
    }
    ctx.body = res;
}))

