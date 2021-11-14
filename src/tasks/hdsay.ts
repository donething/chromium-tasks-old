import {notify, random, sleep} from "../comm/utils"
import {Element} from "cheerio"

import cheerio from "cheerio"

/**
 * www.HDSay.net 视频的任务
 *
 * 使用：需先登录网站回复一个帖子，以保存请求头信息
 */
export const HDSay = {
  // www.HDSay.net 视频的任务
  // 使用：需先登录网站回复一个帖子，以保存请求头信息
  TAG: "[HDSay视频]",

  replies: ["经典中的经典，谢谢楼主分享", "谢谢楼主分享，非常棒的资源", "支持高清的！谢谢😜！",
    "感谢分享，网上在线视频清晰度太低了。", "听说评分很高，先来看看", "回忆一下老电视剧，谢谢楼主分享。"],

  // csrc token 回帖、签到时需要的 token
  csrfToken: "",

  // 依序选择回复内容
  replyID: 0,

  // 一天内奖励回帖的次数
  MAX_REPLY_COUNT: 5,

  /**
   * 执行每项任务
   */
  startTask: async function () {
    // 读取 cookie 中保存的 token
    await fetch("https://www.hdsay.net/member/sign")
    this.csrfToken = (await chrome.cookies.get({
      url: "https://www.hdsay.net/member/sign",
      name: "XSRF-TOKEN"
    }))?.value || ""

    if (!this.csrfToken) {
      console.log(this.TAG, "无法从cookie中获取到'XSRF-TOKEN'值")
      notify({
        title: this.TAG,
        message: "无法从cookie中获取到'XSRF-TOKEN'值",
        buttons: [{title: "打开网站"}, {title: "取消"}]
      }, [() => {
        chrome.tabs.create({url: "https://www.hdsay.net/"})
      }])
      return
    }

    // 签到失败时，大概率是验证到期，需要登录，所以此次后续的回复等操作可以取消
    let signResult = await this.sign()
    if (signResult === 0) {
      console.log(this.TAG, "签到成功，已完成签到任务")
    } else if (signResult === 1) {
      console.log(this.TAG, "服务端返回'500'错误'，可能今日已签过到")
    } else {
      notify({
        title: this.TAG,
        message: "签到出错，需要手动签到一次，可打开控制台查看信息",
        buttons: [{title: "打开网站"}, {title: "取消"}]
      }, [() => {
        chrome.tabs.create({url: "https://www.hdsay.net/member/sign"})
      }])
      return
    }

    // 回帖
    // 完成任务后，保存当天的的日期（如"2021/8/28"），以免一日内重复做任务
    let data = await chrome.storage.sync.get({hdsay: {}})
    let last = data.hdsay.last
    if (new Date().toLocaleDateString() !== last) {
      console.log(this.TAG, "开始执行每日回帖任务")
      let response = await fetch("https://www.hdsay.net/forum/plate?id=24")
      let $ = cheerio.load(await response.text())
      let list = $(".hthemes tr").toArray()

      let index = list.findIndex((elem: Element) => $(elem).text() === "版块主题")
      list.splice(0, index + 1)
      // 网站每天只奖励前5次的回复
      let count = 0
      for (let item of list) {
        // 提取帖子的链接
        let url = $(item).find("a.item").attr("href")
        if (!url) {
          console.log(this.TAG, `提取帖子的链接出错`)
          notify({
            title: this.TAG,
            message: "提取帖子的链接出错"
          })
          return
        }
        // 从链接中提取帖子的ID
        let id = url.substring(url.lastIndexOf("/") + 1, url.lastIndexOf("."))
        if (!(await this.reply(id, this.getContent()))) {
          return
        }

        count++
        console.log(this.TAG, `已回复 ${count}/${this.MAX_REPLY_COUNT} 条帖子`)

        // 判断是否已完成任务（当等于时表示还需最后回复一次，所以还不能跳出）
        if (count === this.MAX_REPLY_COUNT) {
          break
        }
        // 除去最后一次回复完，需等待15秒以上再回复
        if (count < this.MAX_REPLY_COUNT) {
          await sleep((3 + random(3, 5)) * 1000)
        }
      }
      console.log(this.TAG, `已完成自动回复任务`)

      // 完成任务，设置日期标志
      data.hdsay.last = new Date().toLocaleDateString()
      chrome.storage.sync.set({hdsay: data.hdsay})
    }
  },

  /**
   * 签到
   * @return  返回，1：签到成功；2：已签过到；其它：出错
   */
  sign: async function (): Promise<number> {
    let uid = await this.requestUID()
    if (!uid) {
      console.log(this.TAG, "无法获取当前用户的 UID，退出签到")
      return 100
    }
    let url = "https://www.hdsay.net/api/services/app/ForumMemberSign/Create"
    let data = {
      "isActive": true,
      "creatorUserName": null,
      "creationTime": "2021-08-29T18:43:57.7285045+08:00",
      "lastModifierUserName": null,
      "lastModificationTime": null,
      "moodName": "开心",
      "inputModeName": "自己填写",
      "userId": uid,
      "mood": "1",
      "moodWords": "满堂谁是知音者，不惜千金与莫愁。 ",
      "inputMode": "2",
      "description": null,
      "version": 0,
      "id": "00000000-0000-0000-0000-000000000000",
      "__RequestVerificationToken": this.csrfToken
    }

    let ops = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-xsrf-token": this.csrfToken
      },
      body: JSON.stringify(data)
    }
    let resp = await fetch(url, ops)

    let text = ""
    let result = {
      success: false
    }
    try {
      text = await resp.text()
      result = JSON.parse(text)
    } catch (e) {
      // 重复签到时，会响应500错误，此种情况不属于签到出错
      if (text.indexOf("<title>500") >= 0) {
        return 1
      }
      console.log(this.TAG, `签到出错，无法解析响应内容："${e}" ==> "${text}"`)
      return 101
    }

    // 判断结果
    if (result.success) {
      return 0
    } else {
      console.log(this.TAG, `签到失败：${text}`)
      return 102
    }
  },

  //
  //
  /**
   * 回复帖子
   *
   * 会出现 400 错误，很可能是请求头"x-xsrf-token"失效了
   * @param id 帖子的ID
   * @param content 回复内容
   * @return 签到是否成功
   */
  reply: async function (id: string, content: string): Promise<boolean> {
    let url = "https://www.hdsay.net/api/services/app/ForumSiteArticleReply/SaveSiteArticleReply"
    let data = {
      target: "1",
      source: null,
      articleId: id,
      replyId: null,
      bodyText: content,
      body: content
    }

    let ops = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-xsrf-token": this.csrfToken
      },
      body: JSON.stringify(data)
    }
    let resp = await fetch(url, ops)
    let text = ""
    let obj = {
      result: false
    }
    try {
      text = await resp.text()
      obj = JSON.parse(text)
    } catch (e) {
      console.log(this.TAG, `回复帖子"${id}"出错，无法解析响应内容："${e}" ==> "${text}"`)
      notify({
        title: this.TAG,
        message: "回帖出错：可查看控制台的输出信息",
      })
      return false
    }

    // 判断是否成功
    if (obj.result) {
      console.log(this.TAG, `回复帖子"${id}"成功`)
      return true
    } else {
      console.log(this.TAG, `回复帖子"${id}"失败："${text}"`)
      notify({
        title: this.TAG,
        message: "回帖失败，可查看控制台的输出信息",
        buttons: [{title: "打开"}, {title: "取消"}]
      })
      return false
    }
  },

  /**
   * 获取回复的内容，以免连续回复相同的内容
   */
  getContent: function (): string {
    let content = this.replies[this.replyID % this.replies.length]
    this.replyID++
    return content
  },

  /**
   * 获取当前用户的 UID
   */
  requestUID: async function (): Promise<string> {
    // 优先从本地存储中获取 UID
    let uid = (await chrome.storage.local.get({hdsay_uid: ""})).hdsay_uid
    if (uid) {
      return uid
    }
    // 其次联网获取 UID（并保存）
    let resp = await fetch("https://www.hdsay.net/")
    let text = await resp.text()
    let result = text.match(/https:\/\/(?:www\.)?hdsay\.net\/member\/space\?uid=(\d+)/)
    if (result && result.length >= 2) {
      chrome.storage.local.set({hdsay_uid: result[1]})
      return result[1]
    }
    return ""
  }
}