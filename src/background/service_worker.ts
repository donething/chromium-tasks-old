import {anchor} from "../tasks/attention/libs/anchors"
import {app} from "../tasks/attention/libs/apps"
import {HDSay} from "../tasks/hdsay"
import {CCmnn} from "../tasks/ccmnn"
import {random} from "do-utils/dist/utils"

// 监听定时
chrome.alarms.onAlarm.addListener(async alarm => {
  switch (alarm.name) {
    case "threeMin":
      console.log("开始执行每3分钟周期的任务")
      // 主播
      anchor.AnchorUtils.monitor()
      // 应用
      app.AppUtils.monitor()
      break
    case "halfhour":
      // 领取矿场金币
      CCmnn.gainMineCoin()
      break
    case CCmnn.TAG_EN:
      try {
        await CCmnn.autoReply(CCmnn.TAG_EN)
      } catch (e) {
        console.log(CCmnn.TAG, "自动回复奖励贴出错", e)
      }
      chrome.alarms.create(CCmnn.TAG_EN, {delayInMinutes: random(2, 5)})
      break
  }
})

chrome.runtime.onInstalled.addListener(async () => {
  // 每3分钟执行任务
  chrome.alarms.create("threeMin", {delayInMinutes: 1, periodInMinutes: 3})
  // 每半小时执行任务
  chrome.alarms.create("halfhour", {delayInMinutes: 1, periodInMinutes: 30})

  // hdsay
  HDSay.startTask()

  // ccmnn
  await CCmnn.startTask()
  // 自动回复有奖励的帖子
  // 必须等上面的每日回帖任务完成后，才能开始回复奖励帖子的任务，以免因为网站回帖间隔限制（30秒）造成不必要的麻烦
  chrome.alarms.create(CCmnn.TAG_EN, {delayInMinutes: 1})
})