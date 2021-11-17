import {anchor} from "../tasks/attention/libs/anchors"
import {app} from "../tasks/attention/libs/apps"
import {HDSay} from "../tasks/hdsay"
import {CCmnn} from "../tasks/ccmnn"
import {random} from "do-utils/dist/utils"

// CCmnn 的任务比较复杂，单独写规则
const ccmnn = async function () {
  await CCmnn.startTask()

  // 自动回复有奖励的帖子
  chrome.alarms.create(CCmnn.TAG_EN, {delayInMinutes: 1})
  chrome.alarms.onAlarm.addListener(async alarm => {
    if (alarm.name === CCmnn.TAG_EN) {
      try {
        CCmnn.gainMineCoin()
        await CCmnn.autoReply(CCmnn.TAG_EN)
      } catch (e) {
        console.log(CCmnn.TAG, "自动回复奖励贴出错", e)
      }
      chrome.alarms.create(CCmnn.TAG_EN, {delayInMinutes: random(2, 5)})
    }
  })
}

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
  }
})

// 任务
const start = async function () {
  // 每3分钟执行任务
  chrome.alarms.create("threeMin", {delayInMinutes: 1, periodInMinutes: 3})

  HDSay.startTask()
  ccmnn()
}

// 执行
start()

