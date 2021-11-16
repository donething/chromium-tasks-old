/**
 * 获取当前网页中正在播放的占用最大面积的视频元素
 * @param doc 文档
 * @return 视频元素
 * @see google
 */
export const findLargestPlayingVideo = function (doc: Document): HTMLVideoElement | null {
  /** @namespace video.disablePictureInPicture **/
  const videos = Array.from(doc.querySelectorAll('video'))
    .filter(video => video.readyState !== 0)
    // .filter(video => video.disablePictureInPicture === false)
    .sort((v1, v2) => {
      const v1Rect = v1.getClientRects()[0] || {width: 0, height: 0}
      const v2Rect = v2.getClientRects()[0] || {width: 0, height: 0}
      return ((v2Rect.width * v2Rect.height) - (v1Rect.width * v1Rect.height))
    })

  if (videos.length === 0) {
    return null
  }
  return videos[0]
}

/**
 * 发送 chromium 桌面通知
 *
 * 仅在 background 脚本中可用，在 content script 中可使用标准 Web 通知
 *
 * 使用：notify(options, actions)
 * @see https://stackoverflow.com/a/52109693
 * @see https://developer.chrome.com/extensions/notifications#NotificationOptions
 */
export const notify = function (options: chrome.notifications.NotificationOptions, actions: Function[] = []) {
  let myNotificationID = ""

  // 发送通知
  chrome.notifications.create(options, notificationId => {
    myNotificationID = notificationId
  })

  // 为通知的按钮添加点击事件
  chrome.notifications.onButtonClicked.addListener((noID, btnIdx) => {
    if (noID === myNotificationID) {
      if (btnIdx === 0 && actions[0]) {
        actions[0]()
      } else if (btnIdx === 1 && actions[1]) {
        actions[1]()
      }
    }
  })
}

/**
 * 等待指定的毫秒时间
 *
 * 用法为: await sleep(1000) 或 sleep(1000).then(...)
 * @param time 毫秒数
 */
export const sleep = async function (time: number) {
  await new Promise(resolve => setTimeout(resolve, time))
}

/**
 * 返回可读的日期
 * @param date 日期
 * @param askHour12 是否以`12时制`返回，默认 false
 * @return 格式如 "2002/8/15 08:32:08"
 */
export const date = function ({date = new Date(), askHour12 = false}: { date?: Date, askHour12?: boolean }): string {
  return date.toLocaleString("chinese", {hour12: askHour12})
}

/**
 * 返回指定日期的时分
 * @param date 日期
 * @return 格式如 "15:20"
 */
export const hourMinute = function (date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: 'numeric',
    minute: 'numeric'
  })
}

/**
 * 返回年月日
 * @param date 日期
 * @return 格式如 "20200501"
 */
export const day = function (date = new Date()): string {
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  let day = date.getDate()
  return year + (month <= 9 ? "0" + month : month + "") + (day <= 9 ? "0" + day : day + "")
}

/**
 * 将秒数转为时分秒
 * @param seconds 时间戳（秒）
 * @param needTrim 当小时位为 0 时，是否删除开头的"00:"。默认不删除
 *
 * @return 格式如 "01:02:03"、"02:03"
 */
export const sec = function (seconds: number, needTrim = false): string {
  let str = new Date(seconds * 1000).toISOString().substr(11, 8)
  if (str.indexOf("00:") === 0 && needTrim) {
    return str.replace("00:", "")
  }
  return str
}

/**
 * 转换 GBK 编码为 UTF-8 编码的字符串
 * @param arrayBuffer 如果希望传递的参数是 Blob，可先通过`await blob.arrayBuffer()`转换为 ArrayBuffer 后传递
 * @return UTF-8 编码的字符串
 * @see https://stackoverflow.com/a/38490522
 */
export const gbk2UTF8 = function (arrayBuffer: ArrayBuffer): string {
  let decoder = new TextDecoder('gbk')
  return decoder.decode(arrayBuffer)
}

/**
 * 向有序数组中添加元素（新数组依然有序）
 *
 * 也可以直接用于数组排序：myarray.sort(multiComparator(sortRule))
 * @param array 目标数组
 * @param element 待添加的元素
 * @param sortRule 比较器的数组，按传参顺序比较：[onlineSort, platSort, nameSort]
 */
export const insertOrdered = function <T>(array: Array<T>, element: T, sortRule: Array<Function>): Array<T> {
  let i: number
  // react 更新数组，需要生成新数组，界面上才能改变
  let newArray = [...array]

  // 排序规则为空，直接将元素添加到数组末尾
  if (!sortRule || sortRule.length === 0) {
    newArray.push(element)
    return newArray
  }

  // 当排序函数返回值等于 1，表示 element 值比较“大” 要继续往后查找位置
  // 当返回值等于 1- 或 0 时，表示 element 值小于等于 array[1]，应该排在 array[i] 的同一位置或前面
  // 此时退出 for，达到按序插入元素的目的
  for (i = 0; i < newArray.length && multiComparator(sortRule)(element, newArray[i]) >= 1; i++) {
  }
  newArray.splice(i, 0, element)
  return newArray
}

/**
 * 返回的是多重比较器
 * @param  sortRule 比较器的数组，按顺序比较，如 [onlineSort, platSort, nameSort]
 * @returns 返回多重比较器的最终比较函数
 */
export const multiComparator = function (sortRule: Array<Function>): Function {
  return function <T>(a: T, b: T): number {
    let tmp, i = 0
    do {
      tmp = sortRule[i](a, b)
      i++
    } while (tmp === 0 && i < sortRule.length)
    return tmp
  }
}

/**
 * 保存数据到本地
 * @param data 任意类型的数据
 * @param filename 指定文件名
 * @see https://juejin.cn/post/6844903699496566792
 */
export const download = function (data: any, filename: string) {
  switch (typeof data) {
    // 如果是对象，先转为JSON字符串，再保存
    case "object":
      data = JSON.stringify(data)
      // [data]表示将 data 转为数组
      data = [data]
      break
    case "string":
      // [data]表示将 data 转为数组
      data = [data]
      break
  }

  let blob = new Blob(data)
  let a = document.createElement('a')
  let url = window.URL.createObjectURL(blob)
  a.href = url
  a.download = filename || `chromium-task_${Date.now()}`
  a.click()
  window.URL.revokeObjectURL(url)
}

/**
 * 返回两数之间（包含）的随机数
 * @param  min 最小值
 * @param  max 最大值
 * @return 随机数
 * @see https://www.cnblogs.com/starof/p/4988516.html
 */
export const random = function (min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 * 滚动到目标元素
 * @param selector 元素选择器，如 "div.p"
 */
export const scrollIntoView = function (selector: string) {
  let elem = document.querySelector(selector)
  if (!elem) {
    console.log("元素不存在，无法滚动到此")
    return
  }
  elem.scrollIntoView({block: "center", behavior: "smooth"})
}

/**
 * 将文件大小转可读字符串
 * @param size 文件的字节数
 * @return 可读的文件大小，如 "123 KB"
 */
export const fileSize2Str = function (size: number): string {
  if (size <= 0) return "NAN"
  const i = Math.floor(Math.log(size) / Math.log(1024))
  let num = parseInt((size / Math.pow(1024, i)).toFixed(2))
  return num + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i]
}
