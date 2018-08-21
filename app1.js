const Koa = require('./modules/koacus')
const app = new Koa()

app.use(async function (ctx, next) {
    console.log(1)
    await next()
    console.log(6)
})


app.use(async function (ctx, next) {
    console.log(2)
    let a = await next()
    console.log(a)
    console.log(5)
})
app.use(function (ctx, next) {
    console.log(3);
    return new Promise(r => {
        setTimeout(() => {
            r('Promise')
            console.log(4)
            ctx.body = 'Hello Koa';
        }, 2000)
    })
})

app.listen(8000)
console.log('[demo] start-quick is starting at port 3000')