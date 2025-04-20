/**
 * 通用API适配器，用于跨平台兼容性处理
 * @param {string} name - API实例名称，用于日志输出
 * @param {boolean} debug - 是否开启调试模式，开启后会输出更详细的日志
 * @return {Object} 返回API实例
 * @example
 * // 创建API实例
 * const $ = API("BaiduTieba", false);
 */
function API(name = "untitled", debug = false) {
  return new (class {
    /**
     * 构造函数，初始化API实例
     * @param {string} name - API实例的名称
     * @param {boolean} debug - 是否开启调试模式
     */
    constructor(name, debug) {
      this.name = name;
      this.debug = debug;
      
      // 环境判断
      this.isQX = typeof $task !== "undefined";
      this.isLoon = typeof $loon !== "undefined";
      this.isSurge = typeof $httpClient !== "undefined" && !this.isLoon;
      this.isNode = typeof require === "function";
      this.isJSBox = this.isNode && typeof $jsbox !== "undefined";
      this.isStash = typeof $stash !== "undefined";
      this.isShadowrocket = typeof $rocket !== "undefined";
      
      this.platform = this.isQX ? "QX" : 
                    this.isLoon ? "Loon" : 
                    this.isSurge ? "Surge" : 
                    this.isStash ? "Stash" :
                    this.isShadowrocket ? "Shadowrocket" : "Node";
      
      this.log(`当前运行平台: ${this.platform}`);
      
      // 重试选项的键名列表
      this.retryOptionKeys = ['maxRetries', 'retryDelay', 'increaseFactor', 'maxDelay'];
    }
    
    /**
     * 输出日志到控制台
     * @param {...any} args - 要输出的日志内容
     * @example
     * // 基本用法
     * $.log("这是一条日志");
     * 
     * // 输出多个值
     * $.log("用户ID:", userId, "操作:", action);
     */
    log(...args) {
      if (this.debug) {
        console.log(`[${this.name}] `, ...args);
      } else {
        console.log(...args);
      }
    }
    
    /**
     * 发送通知
     * @param {string} title - 通知标题
     * @param {string} subtitle - 通知副标题
     * @param {string} content - 通知内容
     * @param {Object} options - 附加选项，根据不同平台支持不同的特性
     * @example
     * // 基本用法
     * $.notify("签到成功", "", "获得10积分");
     * 
     * // 带有副标题
     * $.notify("签到成功", "每日任务", "获得10积分");
     * 
     * // 使用额外选项 (仅Surge等平台支持)
     * $.notify("签到成功", "", "获得10积分", {"open-url": "https://example.com"});
     */
    notify(title, subtitle, content, options = {}) {
      if (this.isQX) {
        $notify(title, subtitle, content, options);
      } else if (this.isSurge || this.isStash || this.isShadowrocket) {
        $notification.post(title, subtitle, content, options);
      } else if (this.isLoon) {
        if (options) $notification.post(title, subtitle, content, options);
        else $notification.post(title, subtitle, content);
      }
    }
    
    /**
     * 从持久化存储中读取数据
     * @param {string} key - 存储键名
     * @return {string|null} 返回存储的值，如果不存在则返回null
     * @example
     * // 读取用户BDUSS
     * const bduss = $.read("BDUSS");
     * 
     * // 读取配置并提供默认值
     * const timeout = $.read("Timeout") || "5000";
     */
    read(key) {
      if (this.isQX) return $prefs.valueForKey(key);
      if (this.isLoon || this.isSurge || this.isStash || this.isShadowrocket) return $persistentStore.read(key);
    }
    
    /**
     * 向持久化存储中写入数据
     * @param {string} key - 存储键名
     * @param {string} value - 要存储的值
     * @return {boolean} 写入是否成功
     * @example
     * // 存储用户BDUSS
     * $.write("BDUSS", "your-bduss-value");
     * 
     * // 存储上次运行时间
     * $.write("LastRunTime", new Date().toISOString());
     */
    write(key, value) {
      if (this.isQX) return $prefs.setValueForKey(value, key);
      if (this.isLoon || this.isSurge || this.isStash || this.isShadowrocket) return $persistentStore.write(value, key);
    }
    
    /**
     * 将对象转换为查询字符串
     * @param {Object} obj - 要转换的对象
     * @param {boolean} [raw=false] - 是否使用原始值(不进行URL编码)
     * @return {string} 转换后的查询字符串
     * @example
     * // 基本用法(默认进行URL编码)
     * const queryString = $.toQueryString({name: "张三", age: 25});
     * // 结果: "name=%E5%BC%A0%E4%B8%89&age=25"
     * 
     * // 不进行URL编码
     * const rawString = $.toQueryString({name: "张三", age: 25}, true);
     * // 结果: "name=张三&age=25"
     * 
     * // 用于构建URL
     * const url = "https://example.com/api?" + $.toQueryString({id: 123, token: "abc"});
     * 
     * // 用于特殊API请求(不编码)
     * const rawParams = $.toQueryString({text: "Hello & World", flag: true}, true);
     */
    toQueryString(obj, raw = false) {
      return Object.keys(obj).map(key => {
        const value = raw ? obj[key] : encodeURIComponent(obj[key]);
        return `${key}=${value}`;
      }).join('&');
    }
    
    /**
     * 延时等待指定的毫秒数
     * @param {number} ms - 等待时间(毫秒)
     * @return {Promise<void>} Promise对象，在指定时间后resolve
     * @example
     * // 基本用法
     * await $.sleep(1000); // 等待1秒
     * 
     * // 在循环中使用
     * for (let i = 0; i < 5; i++) {
     *   console.log(`第${i+1}次操作`);
     *   await $.sleep(1000); // 每次操作间隔1秒
     * }
     */
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 从选项中提取重试相关的配置
     * 内部使用，用户通常不需要直接调用
     * @param {Object} options - 包含请求选项和重试选项的混合对象
     * @return {Object} 返回分离后的请求选项和重试选项
     */
    extractRetryOptions(options) {
      const retryOptions = {};
      const requestOptions = {...options};
      
      // 提取重试选项
      for (const key of this.retryOptionKeys) {
        if (key in requestOptions) {
          retryOptions[key] = requestOptions[key];
          delete requestOptions[key]; // 从请求选项中移除
        }
      }
      
      return { requestOptions, retryOptions };
    }
    
    /**
     * 带有重试机制的异步函数执行器
     * @param {Function} fn - 要执行的异步函数
     * @param {Object} options - 重试选项配置
     * @param {number} [options.maxRetries=3] - 最大重试次数
     * @param {number} [options.retryDelay=1000] - 初始重试延迟(毫秒)
     * @param {number} [options.increaseFactor=1.5] - 延迟增长因子，每次重试后延迟时间会乘以此值
     * @param {number} [options.maxDelay=10000] - 最大延迟时间(毫秒)
     * @return {Promise<any>} 异步函数执行的结果
     * @example
     * // 基本用法
     * const result = await $.retry(async () => {
     *   return await someAsyncOperation();
     * });
     * 
     * // 自定义重试参数
     * const result = await $.retry(
     *   async () => { return await someAsyncOperation(); },
     *   { maxRetries: 5, retryDelay: 2000, increaseFactor: 2 }
     * );
     */
    async retry(fn, options = {}) {
      const maxRetries = options.maxRetries || 3;
      const retryDelay = options.retryDelay || 1000;
      const increaseFactor = options.increaseFactor || 1.5;
      const maxDelay = options.maxDelay || 10000;
      
      let retries = 0;
      let delay = retryDelay;
      
      while (true) {
        try {
          return await fn();
        } catch (error) {
          retries++;
          if (retries > maxRetries) {
            this.log(`重试失败: 已达最大重试次数 ${maxRetries}`);
            throw error;
          }
          
          // 计算下一次重试的延迟（指数退避）
          delay = Math.min(delay * increaseFactor, maxDelay);
          
          this.log(`请求失败: ${error.message || error}`);
          this.log(`等待 ${delay}ms 后第 ${retries} 次重试...`);
          
          // 等待一段时间后重试
          await this.sleep(delay);
        }
      }
    }
    
    /**
     * HTTP请求方法集合，支持get和post请求，并集成了重试机制
     * @example
     * // GET请求基本用法
     * const response = await $.http.get({
     *   url: "https://example.com/api",
     *   headers: { "User-Agent": "MyApp/1.0" }
     * });
     * 
     * // 带重试选项的GET请求
     * const response = await $.http.get({
     *   url: "https://example.com/api",
     *   headers: { "User-Agent": "MyApp/1.0" },
     *   maxRetries: 5,        // 最多重试5次
     *   retryDelay: 2000,     // 初始等待2秒
     *   increaseFactor: 2,    // 每次重试延迟翻倍
     *   maxDelay: 30000       // 最长等待30秒
     * });
     * 
     * // POST请求带有请求体
     * const response = await $.http.post({
     *   url: "https://example.com/api/login",
     *   headers: { 
     *     "Content-Type": "application/json",
     *     "User-Agent": "MyApp/1.0"
     *   },
     *   body: JSON.stringify({ username: "user", password: "pass" })
     * });
     */
    get http() {
      return {
        /**
         * 发送GET请求
         * @param {Object} options - 请求选项
         * @param {string} options.url - 请求URL
         * @param {Object} [options.headers] - 请求头
         * @param {number} [options.timeout] - 超时时间(毫秒)
         * @param {number} [options.maxRetries] - 最大重试次数，默认3次
         * @param {number} [options.retryDelay] - 初始重试延迟(毫秒)，默认1000ms
         * @param {number} [options.increaseFactor] - 延迟增长因子，默认1.5
         * @param {number} [options.maxDelay] - 最大延迟时间(毫秒)，默认10000ms
         * @return {Promise<Object>} 请求响应对象
         */
        get: async (options) => {
          const { requestOptions, retryOptions } = this.extractRetryOptions(options);
          
          return this.retry(() => {
            if (this.isQX) return $task.fetch({...requestOptions, method: "GET"});
            if (this.isLoon || this.isSurge || this.isStash || this.isShadowrocket) {
              return new Promise((resolve, reject) => {
                $httpClient.get(requestOptions, (error, response, body) => {
                  if (error) reject(error);
                  else resolve({
                    statusCode: response.status || response.statusCode,
                    headers: response.headers,
                    body
                  });
                });
              });
            }
          }, retryOptions);
        },
        
        /**
         * 发送POST请求
         * @param {Object} options - 请求选项
         * @param {string} options.url - 请求URL
         * @param {Object} [options.headers] - 请求头
         * @param {string|Object} [options.body] - 请求体
         * @param {number} [options.timeout] - 超时时间(毫秒)
         * @param {number} [options.maxRetries] - 最大重试次数，默认3次
         * @param {number} [options.retryDelay] - 初始重试延迟(毫秒)，默认1000ms
         * @param {number} [options.increaseFactor] - 延迟增长因子，默认1.5
         * @param {number} [options.maxDelay] - 最大延迟时间(毫秒)，默认10000ms
         * @return {Promise<Object>} 请求响应对象
         */
        post: async (options) => {
          const { requestOptions, retryOptions } = this.extractRetryOptions(options);
          
          return this.retry(() => {
            if (this.isQX) return $task.fetch({...requestOptions, method: "POST"});
            if (this.isLoon || this.isSurge || this.isStash || this.isShadowrocket) {
              return new Promise((resolve, reject) => {
                $httpClient.post(requestOptions, (error, response, body) => {
                  if (error) reject(error);
                  else resolve({
                    statusCode: response.status || response.statusCode,
                    headers: response.headers,
                    body
                  });
                });
              });
            }
          }, retryOptions);
        }
      };
    }
    
    /**
     * 完成脚本执行，通知代理平台任务已完成
     * 必须在脚本最后调用，否则在某些平台上脚本会被强制终止
     * @param {Object} [value={}] - 结束时返回的数据
     * @example
     * // 基本用法，在脚本执行结束时调用
     * $.done();
     * 
     * // 返回数据
     * $.done({status: "success", data: {result: "ok"}});
     */
    done(value = {}) {
      if (this.isQX || this.isLoon || this.isSurge || this.isStash || this.isShadowrocket) {
        $done(value);
      }
    }
  })(name, debug);
}