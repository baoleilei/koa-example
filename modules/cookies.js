const cache = {};

/**
* cookise管理器
* options keys {string}
* options secure {boolean}
**/
class Cookies {
    constructor(req, res, options={keys:'Def_Co'}){
        this.req = req;
        this.res = res;

        this.keys = options.keys;
        this.secure = options.secure;
    }

    get (name){
    	let header, match, value;
    	// 请求头中获取cookie
        header = this.req.headers["cookie"]
        if(!header) return;
        // 在请求头中匹配name
        match = header.match(getPattern(name))
        if(!match) return;
        
        // name值
        value = match[1];

        return value;
    }

    set (name, value, options) {
        let req = this.req, 
        res = this.res, 
        // response.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
        // response.getHeader('Set-Cookie'); 不区分大小写
        headers = res.getHeader("Set-Cookie") || [], 
        secure = this.secure !== undefined ? !!this.secure : req.protocol === 'https',
        cookie = new Cookie(name, value, options);
        
        if(!secure && options && options.secure){
           throw new Error('非https传输, 不可用加密传输');
        }
        // 删除相同key的cookie
        if(cookie.overwrite){
            headers = headers.filter((item)=>{return item.indexOf(`${cookie.name}=`)!== 0;})
        }
        headers.push(cookie.getHeader())
        console.log(headers)
        // cookie写入header
        res.setHeader("Set-Cookie", headers)
    }
}

/**
* cookie存储对象
* 客户端cookie属性: name, value, domain, path, expires, httpOnly, secure, sameSite
* name      String  cookie key值
* value     String  cookie 值
* domain    String  域 表示cookie存放的位置, 服务端如果没有指定则存放为http请求域名, 服务端可以指定顶级域名
* path      String  cookie路径 
* expires   Date    cookie有效期, 是一个时间过来了这时间就失效, 一般服务端用maxAge/max-age设置, 如果服务器返回的cookie没有指定expires 那么cookie
            的有效期是当前session 
* httpOnly  Boolean 表示cookie只能用HTTP(S)传输, 客户端js是服务修改的 
* secure    Boolean 表示是HTTP模式还是HTTPS模式
* sameSite  Boolean 表示cookie是否为严格模式 域名必须和访问域一致
* ********** 
* overwrite Boolean 是否覆盖cookie同名key
**/
class Cookie {
   constructor(name, value, options){
   	    if(!name || !value){
   	    	throw new TypeError('参数错误')
   	    }
        this.name = name;
        this.value = value;

        this.path = "/";
		this.expires = undefined;
		this.domain = undefined;
		this.httpOnly = true;
		this.sameSite = false;
		this.secure = false;
		this.overwrite = false;

        // 初始化自定义变量
		if(options){
			for (let key of Object.keys(options)) {
			   this[key] = options[key];
			}
		}
   }

   toString(){
   	   return `${this.name}=${this.value}` 
   }
   /**
   * 生成cookie
   **/
   getHeader(){
   	let header = this.toString();
   	if(this.maxAge) this.expires = new Date(Date.now() + this.maxAge);
   	// 组装cookie
    if(this.path) header = `${header};path=${this.path}`;
    if(this.expires) header = `${header};expires=${this.expires.toUTCString()}`; // +8 = beijing local time
    if(this.domain) header = `${header};domain=${this.domain}`;
    if(this.httpOnly) header = `${header};httpOnly`;
    if(this.sameSite) header = `${header};sameSite=${this.sameSite===true?'strict':this.sameSite.toLowerCase()}`;
    if(this.secure) header = `${header};secure`;

    return header;
   }
}

/**
* 生成正则, 为匹配header.cookie
**/
function getPattern(name) {
	// 缓存中有返回
  if (cache[name]) return cache[name]

  return cache[name] = new RegExp(
    "(?:^|;) *" +
    name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") +
    "=([^;]*)"
  )
}

module.exports = Cookies;