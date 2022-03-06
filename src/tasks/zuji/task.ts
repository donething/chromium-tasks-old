import {request} from "do-utils"
import {FavOnlineResp, RoomStatus} from "./types"
import {message} from "antd"

const TAG = "[ZuJi]"
const friendApi = "https://appgw-el.yunuo365.cn/v2/friendcircle"
const headers = {
  "Host": "appgw-el.yunuo365.cn",
  "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
  "User-Agent": "yipinlive 6.0.0 rv:220129000 gy Release (iPhone XR; iOS 15.3.1; zh_CN)",
  "Accept-Language": "zh-Hans-CN;q=1.0",
}

export const getRoomsStatus = async (ssid: string, callback: (rooms: Array<RoomStatus>, err?: string) => void) => {
  let start = 0
  let step = 100
  while (true) {
    // 每一次网络请求后，调用一次回调 callback() 处理主播信息
    let payload: Array<RoomStatus> = []
    let data = `count=${step}&sessionid=${ssid}&start=${start}`
    // 执行请求、解析数据
    let response = await request(friendApi, data, {headers: headers})
    let text = await response.text()
    // 先替换小数为字符串，以免损失精度
    text = text.replace(/"gps_latitude":\s*([\d.]+)/, '"gps_latitude": "$1"')
    text = text.replace(/"gps_longitude":\s*([\d.]+)/, '"gps_longitude": "$1"')
    let obj: FavOnlineResp = JSON.parse(text)

    if (obj.reterr) {
      console.log(TAG, "获取主播列表出错：", obj.reterr)
      callback([], obj.reterr)
      break
    }

    for (let item of obj.retinfo.objects) {
      item.content.type = item.type
      payload.push(item.content)
    }

    callback(payload)

    if (obj.retinfo.count < step) {
      console.log(TAG, "已完成读取主播列表")
      break
    }

    start += 100
  }

  // return payload
}