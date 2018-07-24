## 快速开始
  ### 环境安装
  

## async/await原理

运行代码

```
const koa = require('koa')

const app = new koa()
app.listen(3000)

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
            r('s')
            console.log(4)
        }, 2000)
    })
})
```

从上面的结果来看会依次输出，可就简单的一个 await next()， 为嘛会有这种效果，这里，我首先简单说一下koa2中间件的实现原理。

这里先从 koa的使用说起

首先看 use ，就是push一个函数到 this.middleware。
再看listen, 方法里面 http.createServer(this.callBack), this.callBack返回的是 function(req,res){…}的函数，连起来就是 http.createServer(function(req,res){…})，标准的http创建服务的方法。
最后看callback，里面的核心方法， compose() 返回一个promise，处理完毕后再执行 .then(()=> res.end())。
这三个连起来，就是每次请求的时候，先进入callback, compose中间件，执行完毕后，接着处理请求。那剩下的重点变为 compose  

```
listen(num) {
    http.createServer(this.callback()).listen(num)
}

use(fn) {
    this.middleware.push(fn)
}

callback() {
    return (req, res) => {
        if (req.url !== '/favicon.ico') this.compose({req, res}).then(()=> res.end('aaaaa'))
    }
}

``` 

我们继续深入研究，核心的核心就是dispatch, dispatch会根据 middleware 的长度，依次执行。

```
compose(ctx) {
    let dispatch = i => Promise.resolve(this.middleware[i](ctx, () => dispatch(i + 1)))
    return dispatch(0)
}
```

在往下分析，假定现在执行第一个fn，这个时候第一个fn是什么

```
return Promise.resolve(fn(context, function next () {
	return dispatch(i + 1)
}))
```

与上面的参数对应关系如下

context ：ctx,

next : function next(){ return dispatch(i+1)}

所以 await next() 就等于 await function next(){ return dispatch(i+1)} , 而 dispatch(i+1)就进入了下一个中间件了。

核心就是 dispatch(i+1),也就是dispatch(1) , dispatch本身返回promise, 所以你就在这里 await 。

依此类推 disptach(1) 会执行 this.middleware[1]，就这么推下去。

关于结束，还是 next 不存在的时候。 结果完毕后，再依次往上走。

所以执行的顺序是越先注册越后执行， 当然还得看你 await next() 放在什么位置。