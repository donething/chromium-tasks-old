/**
 * 通过微信测试号推送模板消息
 *
 * 可使用 chromiumStorageWXPush() 或 localStorageWXPush() 快速创建实例。
 * 还可使用 new WXPush(appid, secret) 创建通用实例
 *
 * 可使用 WXPush.MsgTpls.general() 快速生成通用模板消息（需根据消息模板修改代码中的占位符）
 *
 * 使用 wxPush.pushTpl() 推送模板消息
 *
 * 例：let wx =await WXPush.chromiumStorageWXPush()
 *
 * let resp = await wx.sandbox.pushTpl(wx.toUID, wx.tpl, WXPush.MsgTpls.general("标题", "信息", "2018年"));
 */
export class WXPush {
  // 用于获取 token，在构造函数中传递，不要手动赋值
  readonly #appid: string = "";
  readonly #secret: string = "";

  /**
   * 保存推送的token的信息
   * token、过期时间（为 返回的过期间隔（秒）* 1000 + 当前时间戳）
   */
  #tokenInfo = {token: "", expires: 0};

  // 生成消息模板
  static MsgTpls = {
    /**
     * 生成通用消息模板，会在除末行外每行末尾追加换行符'\n'
     * @param time 发送时间
     * @param title 标题
     * @param msg 内容
     */
    general: function (title: string, msg: string, time: string) {
      return {
        title: {value: title + "\n"},
        msg: {value: msg + "\n\n"},
        time: {value: time},
      };
    },
    /**
     * 生成短信转发消息模板
     * @param title 标题
     * @param body 短信正文
     * @param sender 发送方
     * @param time 发送时间
     */
    sms: function (title: string, body: string, sender: string, time: string) {
      return {
        title: {value: title + "\n"},
        body: {value: body + "\n\n"},
        sender: {value: sender + "\n"},
        time: {value: time},
      };
    }
  };

  /**
   * 构造函数，实例化类时传递
   * @param appid 测试号信息的 id
   * @param secret 测试号信息的 secret
   */
  constructor(appid: string, secret: string) {
    this.#appid = appid;
    this.#secret = secret;
  }

  /**
   * 根据存储在 chromium storage 的 token 信息返回含有 WXPush 实例和消息模板 id、接收者 id
   * @return {Promise<{sandbox: WXPush, tplID: string, toUID: string}>}
   */
  static async chromiumStorageWXPush() {
    let data = await chrome.storage.sync.get({wxToken: {}});
    let token = data.wxToken;
    return {
      sandbox: new WXPush(token.appid, token.secret),
      tplID: token.tplID,
      toUID: token.toUID
    };
  }

  /**
   * 根据存储在本地 localstorage 的 token 信息返回含有 WXPush 实例和消息模板 id、接收者 id
   * @return {{sandbox: WXPush, tplID: String, toUID: String}}
   */
  static localStorageWXPush(key: string) {
    let token = JSON.parse(localStorage.getItem(key) || "{}");
    return {
      sandbox: new WXPush(token.appid, token.secret),
      tplID: token.tplID,
      toUID: token.toUID
    };
  }

  /**
   * 获取微信推送的token
   */
  async getToken() {
    if (this.#tokenInfo.token !== "" && new Date().getTime() < this.#tokenInfo.expires) return;
    let tokenURL = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential" +
      "&appid=" + this.#appid + "&secret=" + this.#secret;
    let resp = await fetch(tokenURL);
    let obj = await resp.json();
    if (obj["errcode"]) {
      throw new Error("获取微信推送的token时出错：" + JSON.stringify(obj));
    }
    this.#tokenInfo.token = obj["access_token"];
    this.#tokenInfo.expires = obj["expires_in"] * 1000 + new Date().getTime();
  }

  /**
   * 推送模板消息
   * @param  toUID 目标用户的 ID
   * @param  tplID 模板 ID
   * @param  payload 填充模板的数据，可使用 MsgTpls 中的方法快速生成
   * @param url 点击消息时的跳转链接
   * @return {Promise<{errcode: number, errmsg: string}>} 推送成功时 errcode 为 0
   */
  async pushTpl(toUID: string, tplID: string, payload: object, url?: string) {
    // 判断是否更新token
    await this.getToken();
    let pushURL = "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=" +
      this.#tokenInfo.token;

    // 消息的数据
    let data = {
      touser: toUID,
      template_id: tplID,
      url: url,
      data: payload
    };

    // 推送消息
    let ops = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    };
    let resp = await fetch(pushURL, ops);
    let obj = await resp.json();
    return {
      errcode: obj.errcode,
      errmsg: obj.errmsg
    };
  }
}
