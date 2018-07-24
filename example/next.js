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

// fn1(next=>{return fn2(next=>{fn3()})})