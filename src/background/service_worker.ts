import {anchor} from "../tasks/attention/libs/anchors"
import {app} from "../tasks/attention/libs/apps"
import {HDSay} from "../tasks/hdsay"
import {CCmnn} from "../tasks/ccmnn"

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
      console.log("开始执行每半小时周期的任务")
      // 领取矿场金币
      CCmnn.gainMineCoin()
      break
    case CCmnn.TAG_EN:
      console.log(CCmnn.TAG, `开始执行"${CCmnn.TAG_EN}"周期的任务`)
      try {
        await CCmnn.autoReplyAward()
      } catch (e) {
        console.log(CCmnn.TAG, "自动回复奖励贴出错", e)
      }
      chrome.alarms.create(CCmnn.TAG_EN, {delayInMinutes: 1})
      break
  }
})

chrome.runtime.onInstalled.addListener(async () => {
  // 每3分钟执行任务
  chrome.alarms.create("threeMin", {delayInMinutes: 1, periodInMinutes: 3})
  // 每半小时执行任务
  chrome.alarms.create("halfhour", {delayInMinutes: 1, periodInMinutes: 30})
})


// 每次运行浏览器时执行
chrome.runtime.onStartup.addListener(async () => {
  // 因为 manifest mv3 对 service worker 的运行时间有限制，所以打开一个扩展页面绕过限制
  chrome.tabs.query({url: `chrome-extension://${chrome.runtime.id}/*`}, tabs => {
    if (tabs.length === 0) {
      console.log("打开扩展页面，绕过 service worker 的运行时间限制")
      chrome.tabs.create({url: "/index.html#/tasks"})
    }
  })

  // hdsay
  HDSay.startTask()

  // ccmnn
  await CCmnn.startTask()
  // 自动回复有奖励的帖子
  // 必须等上面的每日回帖任务完成后，才能开始回复奖励帖子的任务，以免因为网站回帖间隔限制（30秒）造成不必要的麻烦
  chrome.alarms.create(CCmnn.TAG_EN, {delayInMinutes: 1})
})