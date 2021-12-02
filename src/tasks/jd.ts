// 领取京东的京豆
import {request} from "do-utils"

export const JD = {
  TAG: "京豆",

  sign: async function () {
    let total = 0
    // 签到的京豆
    let url = "https://api.m.jd.com/client.action?functionId=signBeanIndex&" +
      "body=%7B%22monitor_refer%22%3A%22%22,%22rnVersion%22%3A%223.9%22,%22fp%22%3A%22-1%22," +
      "%22shshshfp%22%3A%22-1%22,%22shshshfpa%22%3A%22-1%22,%22referUrl%22%3A%22-1%22," +
      "%22userAgent%22%3A%22-1%22,%22jda%22%3A%22-1%22,%22monitor_source%22%3A%22bean_m_bean_index%22%7D&" +
      "appid=ld&client=android&clientVersion=null&networkType=null&osVersion&uuid=null&" +
      `jsonp=jsonp_${Date.now()}_89861`
    let resp = await request(url)
    let result = await resp.json()
    let dataStr = result.body.substring(result.body.indexOf("(") + 1, result.body.lastIndexOf(")"))
    let obj = JSON.parse(dataStr)
    if (obj.data.dailyAward.title === "签到成功") {
      total += parseInt(obj.data.dailyAward.beanAward.beanCount)
    } else if (obj.data.dailyAward.title === "今天已签到") {
      // 重复签到
    } else {
      console.log(this.TAG, "领取签到的京豆出错：", result.body)
    }

    // 转盘
  }
}