## 1. 快速开始
  #### 环境安装
  Node安装，要求7.x版本以上
  
  创建koa项目
  
  * 创建 koa 目录并进入
  * npm init
  * npm i -D koa
  * 创建app.js 文件
  
helloword 代码

```
const Koa = require('koa')
const app = new Koa()

app.use( async ( ctx ) => {
  ctx.body = 'hello world'
})

app.listen(3000)
console.log('[demo] start-quick is starting at port 3000')
```

运行

```
node app.js
```

访问:http:localhost:3000

## 2. debug

`--inspect` 参数是启动调试模式

```
node --inspect app.js
```

第一种模式是在 Chrome 浏览器的地址栏，键入 `chrome://inspect ` 或者`about:inspect`，回车后就可以看到下面的界面。

![image](http://www.ruanyifeng.com/blogimg/asset/2018/bg2018031903.png)

在 Target 部分，点击 inspect 链接，就能进入调试工具了。

第二种进入调试工具的方法，是在 http://127.0.0.1:3000 的窗口打开"开发者工具"，顶部左上角有一个 Node 的绿色标志，点击就可以进入

![image](http://www.ruanyifeng.com/blogimg/asset/2018/bg2018031904.png)

然后在 Source 面板中找到要调试的文件，设置断电 调试即可。


## 3. async/await原理

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

先看一个简单的栗子：

```
function fn1(next){
    console.log('start', 1)
    next()
    console.log('end' , 1)
}
function fn2(next){
    console.log('start', 2)
    next()
    console.log('end' , 2)
}
function fn3(next){
    console.log('-->', 3)
}

```

如何实现输出：
```
start 1
start 2
--> 3
end 2
end 1
```

比如这样：

```
fn1(next=>{return fn2(next=>{fn3()})})
```

改造称函数式compose 组合模式：

```
function compose (...args){
    return function (){ 
        return dispatch(0)  
        
        function dispatch(i){
            const fn = args[i]
            if(!fn)return
            fn(next=>{dispatch(i+1)})
        }
    }

    
}

var fn = compose(fn1, fn2, fn3)

fn() 
```
从上面的栗子可以看出koa的实现基本原理就是采用的compose的方式

我们在先从 koa的使用说起

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

完整代码 `koa.js` ：

```
const http = require('http')


class Koa {
    constructor(){
        this.middleware = []
      this.ctx = {}
    }

   listen(num){
       http.createServer(this._callback()).listen(num)
   }

   use(fn){
    this.middleware.push(fn)
   }

   _callback() {
      return (req, res) => {
        if (req.url !== '/favicon.ico') this._compose({req, res}).then(()=> {
            if(this.ctx.body){
               res.write(this.ctx.body)
            }
            res.end()
         })
      }
   }

   _compose(ctx) {
        this.ctx = ctx;
      let dispatch = i => Promise.resolve(this.middleware[i](ctx, () => dispatch(i + 1)))
        return dispatch(0)
   }

}

module.exports = Koa
```

## 3. 中间件

中间件顾名思义，即是在请求到结束过程中执行的，可以横向的切割每个请求，比如Logger

```
function log( ...msg ) {
    console.log.apply(null, msg)
}

module.exports = function () {
  return async function ( ctx, next ) {
    const start = Date.now();
    log('start time', start);
    await next();
    const ms = Date.now() - start;
    log(`res url ${ctx.url} - ${ms} ms`);
  }
}
```

使用

```
const Koa = require('koa')
const logger  = require('./middleware/logger')
const app = new Koa()

app.use(logger())
app.use( async ( ctx ) => {
  ctx.body = 'hello world'
})

app.listen(3000)
console.log('[demo] start-quick is starting at port 3000')
```

## 4. router
解析接口请求，koa原生并没有提供路由解析
如何实现：`/getName` 这样接口请求呢？
我们可以使用 `koa-route` 模块
```
const route = require('koa-route');

app.use(route.get('/getName', callback));
```

上面的代码主要是 提供get方法，路径path ，回调callback

如何实现一个Router呢

```
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
```

测试下上面的route模块

```
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


```

```
http://localhost.yunshanmeicai.com:3001/person
// => [{"name":"jack","age":12},{"name":"mali","age":34}]

http://localhost.yunshanmeicai.com:3001/person/jack

// => {"name":"jack","age":12}
```


## 5. 错误处理

错误处理包括可捕获 `throw` 错误，通常一个服务接口都是很多的，如果在每个业务中处理 `throw` 太繁琐，可以使用中间件处理

error_mid.js

```
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
```

另外一种是异步回调错误处理比如：`setTimeout` `process.nextTick` 等
这样的错误 `try catch` 是无法捕获到的




## 6. cookie
## 7. session
## 8. body-parse
## 9. DB-
