// fn为构造函数参数
function MyPromise(fn){
    // 加入状态，初始状态为pendding
    this.state = 'pending';
    // 回调队列，用来存放then方法注册的回调函数
    this.callbacks = [];
    // promise的终值
    this.value = null;
    // 构造函数参数被调用
    fn(this._resolve.bind(this),this._reject.bind(this));
}

// then方法
MyPromise.prototype.then = function(onFulfilled,onRejected){
    var that = this;
    return new MyPromise(function(resolve,reject){
        that._handle({
            onFulfilled:onFulfilled || null,
            onRejected: onRejected || null,
            resolve:resolve,
            reject: reject
        });
    });
}

// promise then方法公共处理
MyPromise.prototype._handle = function(callback){
    if(this.state === 'pending'){
        this.callbacks.push(callback);
        return;
    }
     var cb = this.state === 'fulfilled' ? callback.onFulfilled : callback.onRejected,
            ret;
        if (cb === null) {
            cb = this.state === 'fulfilled' ? callback.resolve : callback.reject;
            cb(this.value);
            return;
        }
        // 错误捕获
        try{
            ret = cb(this.value);
            callback.resolve(ret);
        }catch(e){
            callback.reject(e);
        }
}


// 执行成功，result为终值
MyPromise.prototype._resolve = function(result){
    // 判断传递的值是否是promise
    if( result && (typeof result === 'object' || typeof result === 'function' ) ){
        var then = result.then;
        if( typeof then === 'function' ){
            then.call(result,that._resolve);
            return;
        }
    }
    
    this.value = result;
    this.state = 'fulfilled';
    this._execute();
}

// 执行失败的拒绝态，reason为拒因
MyPromise.prototype._reject = function(reason){
    this.value = reason;
    this.state = 'rejected';
    this._execute();
}

// 执行回调函数
MyPromise.prototype._execute = function(){
   var that = this;
    // 加入延时，将resolve中执行回调的逻辑放置到JS任务队列末尾，以保证在resolve执行时，then方法的回调函数已经注册完成.
    setTimeout( function(){
        that.callbacks.forEach(function(callback){
            that._handle(callback);
        });
    },0);
}
