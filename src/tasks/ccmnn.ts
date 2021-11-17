import {gbk2UTF8, notify, random, sleep} from "do-utils/dist/utils"
import cheerio from "cheerio"

/**
 * club.ccmnn.com 视频的任务
 *
 * 使用：需先登录网站回复一个帖子，以保存请求头信息
 */
export const CCmnn = {
  TAG: "[CCmnn视频]",
  TAG_EN: "ccmnn",

  cheerio: require('cheerio'),

  // 一天内奖励回帖的次数
  MAX_REPLY_COUNT: 30,

  // 每个回复的间隔时间（秒）
  wait: (30 + random(3, 5)) * 1000,

  // 回复的内容（使用 GB2312 编码 encodeURIComponent）
  replies: [
    "%BA%C3%D7%CA%D4%B4%B0%A1%A3%AC%CF%C8%CA%D5%B2%D8%C6%F0%C0%B4%A3%AC%CF%B8%CF%B8%B9%DB%BF%B4",
    "%C3%BB%CF%EB%B5%BD%D3%D6%BF%B4%B5%BD%C1%CB%A3%AC%C4%C7%B1%A3%B4%E6%D4%D9%BF%B4%D2%D4%B1%E9",
    "%D5%E2%C3%B4%BA%C3%B5%C4%D7%CA%D4%B4%A3%AC%D5%E2%C3%B4%BF%EC%BE%CD%B7%A2%B2%BC%A3%AC%CC%AB%BA%C3%C1%CB",
    "%D5%E2%B8%F6%B8%D5%B8%D5%BF%B4%B9%FD%A3%AC%B7%C7%B3%A3%BE%AB%B2%CA%A3%A1%A3%A1",
    "%BE%AB%C6%B7%D7%CA%D4%B4%A3%AC%B4%F3%BC%D2%B6%A5%C6%F0%B0%C9%A3%AC%CE%D2%CF%C8%B1%A3%B4%E6%C1%CB%A3%A1",
    "%C2%A5%D6%F7%CC%AB%B8%F8%C1%A6%C1%CB%A3%AC%D5%D2%C1%CB%BA%DC%BE%C3%A3%AC%CF%C2%D4%D8%D6%D0%A1%AD%A1%AD",
    "%D0%BB%D0%BB%B7%A2%B2%BC%BA%C3%D7%CA%D4%B4%A3%A1%D5%D2%C1%CB%BA%DC%BE%C3%C1%CB%A3%AC%B8%D0%BC%A4",
    "%B8%D0%D0%BB%C2%A5%D6%F7%B7%A2%B2%BC%D5%E2%C3%B4%B8%F8%C1%A6%B5%C4%D7%CA%D4%B4%A3%AC%B0%A5"
  ],
  // 5个用户的ID，用于浏览空间
  uidList: ["116019", "115615", "21666", "284924", "232773"],

  // 依序选择回复内容
  replyID: 0,

  // 需要回帖获取奖励的版块
  areas: ["2", "42", "45", "46", "50", "53", "55", "56", "58", "63"],

  // 表单验证
  formhash: "",

  /**
   * 执行每项任务
   */
  startTask: async function () {
    // 先获取 formhash
    this.formhash = await this.getHash()
    if (this.formhash === "") {
      console.log(this.TAG, "获取formhash失败")
      notify({title: this.TAG, message: "获取formhash失败，可打开控制台查看信息"})
      return
    }

    // 签到失败时，大概率是验证到期，需要登录，所以此次后续的回复等操作可以取消
    let signResult = await this.sign()
    // 每天首次成功签到后，执行其它任务
    if (signResult === 0) {
      console.log(this.TAG, `签到成功，已完成签到任务`)
      // 其它任务
      this.shuoshuo()
      this.viewSpaces()
    } else if (signResult === 1) {
      console.log(this.TAG, `今日已经签过到`)
    } else {
      let ops = {title: this.TAG, message: "签到失败，可打开控制台查看信息", buttons: [{title: "打开"}, {title: "取消"}]}
      notify(ops, [() => chrome.tabs.create({url: "https://club.ccmnn.com/"})])
      return
    }

    // 每日前几次回贴可领取金币
    // 完成任务后，保存当天的的日期（如"2021/8/28"），以免一日内重复做任务
    let data = await chrome.storage.sync.get({ccmnn: {}})
    let last = data.ccmnn.last
    if (new Date().toLocaleDateString() !== last) {
      console.log(this.TAG, "开始执行每日回帖任务")
      let resp = await fetch("https://club.ccmnn.com/forum-53-1.html")
      let $ = cheerio.load(await resp.text())
      let list = $("#threadlisttableid tbody").toArray()

      // 网站每天只奖励前几次的回复
      let count = 0
      for (let item of list) {
        let elem = $(item)
        let idstr = elem.attr("id") || ""
        // 不是帖子则跳过
        if (elem.find("th > em").length === 0 || !idstr
          || idstr.indexOf("thread") === -1) {
          continue
        }
        // 帖子已有的回复数，转为数字后加上主楼
        // let countText = item.querySelector(".num font").textContent;
        // let floor = parseInt(countText) + 1;
        // 帖子的 ID
        let id = idstr.substring(idstr.indexOf("_") + 1)

        let result = await this.reply(id, this.getContent())
        // 当回帖失败的原因是阅读权限时继续回复下一个帖子；是其它原因时退出回帖
        if (result === 1) {
          continue
        } else if (result >= 10) {
          break
        }

        count++
        console.log(this.TAG, `已回复 ${count}/${this.MAX_REPLY_COUNT} 条帖子`)

        // 判断是否已完成任务
        if (count === this.MAX_REPLY_COUNT) {
          break
        }

        await sleep(this.wait)
      }
      console.log(this.TAG, `已完成回贴任务`)
      // 完成任务，设置日期标志
      data.ccmnn.last = new Date().toLocaleDateString()
      chrome.storage.sync.set({ccmnn: data.ccmnn})
    }
  },

  /**
   * 获取formhash，签到、回复时需要携带
   * @returns {Promise<String>}
   */
  getHash: async function () {
    let hashResult = await fetch("https://club.ccmnn.com/")
    let text = await hashResult.text()
    let m = text.match(/<input.*?formhash.*?value="(\w+)"/)
    if (m && m.length === 2) {
      return m[1]
    }
    return ""
  },

  /**
   * 签到
   * @return {Promise<Number>} 0 为签到成功；1 为已签过到；其它 为出错
   */
  sign: async function () {
    let url = "https://club.ccmnn.com/plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=1&inajax=1"
    let data = `formhash=${this.formhash}&qdxq=kx&qdmode=3&todaysay=&fastreply=0`
    let ops = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: data
    }
    let resp = await fetch(url, ops)
    let respStr = gbk2UTF8(await resp.arrayBuffer())

    if (respStr.indexOf("签到成功") >= 0) {
      return 0
    } else if (respStr.indexOf("今日已经签到") >= 0) {
      return 1
    } else {
      console.log(this.TAG, `签到失败："${respStr}"`)
      return 100
    }
  },

  // 定时检查有奖励的帖子，回复（最多可回复2次，获取奖励）
  autoReply: async function (alarmName: string) {
    console.log(this.TAG, "开始回复有奖励的帖子")
    let data = await chrome.storage.local.get({ccmnn_reward_ids: null})
    let ids = new Set(data.ccmnn_reward_ids)

    for (let area of this.areas) {
      // 读取、解析网页
      let resp = await fetch(`https://club.ccmnn.com/forum-${area}-1.html`)
      let text = gbk2UTF8(await resp.arrayBuffer())
      let $ = cheerio.load(text)
      let rewardItems = $("#threadlisttableid tr .xi1 strong").toArray()

      // 遍历有回复奖励的帖子
      for (let item of rewardItems) {
        // 帖子已有的回复数，转为数字后加上主楼
        // let countText = item.closest("tbody").querySelector(".num font").textContent;
        // let floor = parseInt(countText) + 1;

        let idstr = $(item).closest("tbody").attr("id")
        if (!idstr) {
          notify({title: this.TAG, message: "无法提取到帖子的ID"})
          console.log(this.TAG, "无法提取到帖子的ID", text)
          return
        }
        let id = idstr.substring(idstr.indexOf("_") + 1)
        if (ids.has(id)) {
          // console.log(this.TAG, `该奖励贴"${id}"之前已回复过`);
          continue
        }

        // 获取帖子详情页里回帖奖励的次数（1次还是2次）
        let postContentResp = await fetch(`https://club.ccmnn.com/${id}-1.htm`)
        let doc = cheerio.load(await postContentResp.text())
        let countElem = doc("tr td.plc.ptm.pbm.xi1").find("b")
        // 可能是延时，实际该贴的奖励已领完，没有该标签
        if (!countElem.text()) {
          continue
        }
        // 奖励的次数
        let count = parseInt(countElem.text())
        if (isNaN(count)) {
          console.log(this.TAG, `解析奖励次数出错：${countElem.text()}`)
          continue
        }
        // 根据次数领取奖励
        for (let i = 0; i < count; i++) {
          // floor++;
          let result = await this.reply(id, this.getContent())
          // 当回帖失败的原因是阅读权限时继续回复下一个帖子；是其它原因时退出回帖
          if (result === 1) {
            break
          } else if (result >= 10) {
            console.log(this.TAG, "自动回帖失败，退出")
            chrome.alarms.clear(alarmName)
            return
          }

          await sleep(this.wait)
        }

        // 记录已领取奖励的帖子ID
        ids.add(id)
        chrome.storage.local.set({ccmnn_reward_ids: Array.from(ids)})
      }
    }
    console.log(this.TAG, "已完成本次回复有奖励帖子的任务")
  },

  /**
   * 回复帖子
   * @param {String} id 帖子的ID（184274）
   * @param {String} content 回复内容
   * @returns {Promise<Number>} 回复的结果，1：成功，2：阅读权限不够，10+：回帖失败
   */
  // @ts-ignore
  reply: async function (id: string, content: string): Promise<number> {
    let url = "https://club.ccmnn.com/forum.php?mod=post&action=reply&fid=53&tid=" + id
      + "&extra=&replysubmit=yes&infloat=yes&handlekey=fastpost&inajax=1"
    let data = `message=${content}&formhash=${this.formhash}&usesig=1&subject=`

    let ops = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: data
    }
    let resp = await fetch(url, ops)

    let respStr = gbk2UTF8(await resp.arrayBuffer())
    if (respStr.indexOf("回复发布成功") >= 0) {
      console.log(this.TAG, `回复帖子"${id}"成功`)
      return 0
    } else if (respStr.indexOf("阅读权限不少于") >= 0) {
      console.log(this.TAG, `阅读权限不够打开帖子"${id}"，返回`)
      return 1
    } else if (respStr.indexOf("发表间隔") >= 0) {
      let result = respStr.match(/还剩\s+(\d+)\s+秒/)
      if (result && result.length >= 2) {
        console.log(this.TAG, `两次回帖间隔，还需要等待 ${result[1]} 秒`)
        await sleep((parseInt(result[1]) + 1) * 1000)
        return await this.reply(id, content)
      }
    } else if (respStr.indexOf("含有非法字符") >= 0) {
      console.log(this.TAG, `回复帖子"${id}"失败：当前的访问请求当中含有非法字符，已经被系统拒绝`)
      notify({title: this.TAG, message: "回帖失败，可打开控制台查看信息"})
      return 10
    } else if (respStr.indexOf("登录后") >= 0) {
      console.log(this.TAG, `回复帖子"${id}"失败：需要登录（回复一次帖子）`)
      notify({title: this.TAG, message: "回帖失败，可打开控制台查看信息"})
      return 11
    } else {
      console.log(this.TAG, `回复帖子"${id}"失败："${respStr}"`)
      notify({title: this.TAG, message: "回帖失败，可打开控制台查看信息"})
      return 100
    }
  },

  // 发表说说
  shuoshuo: async function () {
    let url = "https://club.ccmnn.com/home.php?mod=spacecp&ac=doing&view=me"
    let data = "message=%5Bem%3A4%3A%5D%5Bem%3A5%3A%5D%B9%FD%BA%C3%C3%BF%D2%BB%CC%EC%A1%AD%A1%AD" +
      "&add=&addsubmit=true&refer=home.php%3Fmod%3Dspace%26uid%3D323248%26do%3Ddoing%26view%3Dme%26from%3Dspace" +
      `&topicid=&formhash=${this.formhash}`

    let ops = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: data
    }

    for (let i = 0; i < 5; i++) {
      await fetch(url, ops)
      await sleep(random(1, 3) * 1000)
    }
    console.log(this.TAG, "已完成说说任务")
  },

  // 查看别人的空间
  viewSpaces: async function () {
    for (const uid of this.uidList) {
      let url = `https://club.ccmnn.com/home.php?mod=space&uid=${uid}`
      await fetch(url)
      await sleep(random(1, 3) * 1000)
    }
    console.log(this.TAG, "已完成浏览空间的任务")
  },

  // 领取矿场金币
  gainMineCoin: async function () {
    // 需要先访问矿场页面刷新才能领取矿场产生的金币
    let reUrl = "https://club.ccmnn.com/plugin.php?id=hux_miner:hux_miner&ac=re&" +
      `formhash=${this.formhash}&t=${Math.random()}`
    await fetch(reUrl, {method: "POST"})

    // 领取金币
    let url = "https://club.ccmnn.com/plugin.php?id=hux_miner:hux_miner&ac=draw&" +
      `formhash=${this.formhash}&t=${Math.random()}`
    let resp = await fetch(url, {method: "POST"})
    let text = gbk2UTF8(await resp.arrayBuffer())
    console.log(this.TAG, "领取矿场金币：", text)
  },

  /**
   * 获取回复的内容，以免连续回复相同的内容
   * @return {String}
   */
  getContent: function () {
    let content = "%3A%7B_%3A%7B_" + this.replies[this.replyID % this.replies.length]
    this.replyID++
    return content
  }
}
