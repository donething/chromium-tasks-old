import {StorePic, Task} from "./pic_task_comp"
import {request} from "do-utils"
import {message} from "antd"
import {sleep} from "do-utils/dist/utils"
import React from "react"
import {delRevoke} from "../../comm/antd"
import {download} from "do-utils/dist/elem"
import {sha256} from "do-utils/dist/text"

// 微博图集，将保存到本地 json 文件中，可传给服务端下载
type Album = {
  // 所在的平台（如“微博”）
  plat: string
  // 该图集的微博 ID
  id: string
  // 图集所属用户的 ID
  uid: string
  // 图集的标题
  caption: string
  // 图集的创建时间（不同于发布时间）
  created: number
  // 最大分辨率的图片地址列表
  urls: Array<string>
  // 中等分辨率的图片地址列表
  urls_m: Array<string>
}

// 微博列表 API 返回的数据
type WBList = {
  // 是否正确响应
  ok: number
  data: {
    list: Array<WBTopic>
  }
}
// 一条微博
type WBTopic = {
  // 已收藏人数
  attitudes_count: number
  // 评论条数
  comments_count: number
  // 此条微博创建时间，如"Wed Dec 01 01:33:33 +0800 2021"
  created_at: string
  // 本人是否已收藏该条微博
  favorited: boolean
  // 该微博的 ID，如 419940710522042
  id: number
  // 该微博的 ID（同 mid），如"419940710522042"
  idstr: string
  // 是否为付费
  is_paid: boolean
  // 微博的 mblogid，如"L5wIulUw5"，可以根据算法和 mid 互转
  mblogid: string
  // 微博的 mid（同 idstr），如"419940710522042"
  mid: string
  // 包含的图片 ID 列表，如["006AfEgvgy13gw42p1oxyh5j3wx731v4qp"]，可使用该 ID 从 pic_infos 中获取详细信息
  pic_ids: Array<string>
  // 包含的图片信息列表
  pic_infos: { [picID: string]: PicInfos }
  // 包含的图片数量
  pic_num: number
  // 浏览次数
  reads_count: number
  // 转发次数
  reposts_count: number
  // 客户端，如"iPhone客户端"
  source: string
  // 纯文本内容，如"点个赞吧<br/><img alt=\"[心]\" src=\"https://face.t.sinajs.cn/t4/example.png\"/>"
  text: string
  // 渲染后的文本内容，如"点个赞吧\n[心]"
  // 两个 text 都很可能含有“非零字符”，需要将之删除：text_raw.replace(/[\s\u200B-\u200D\uFEFF]/g, "")
  text_raw: string
  // 博主的信息
  user: User
  // 当为转贴时，为原贴数据
  retweeted_status: WBTopic
}

// 图片的详细信息
type PicInfos = {
  // 缩略图，如
  thumbnail: PicInfo
  // 中等尺寸图片
  bmiddle: PicInfo
  // 大尺寸图片
  large: PicInfo
  // 原图
  original: PicInfo
  // 最大（推荐获取，分辨率最大）
  largest: PicInfo
  mw2000: PicInfo
  // 图片的 ID，如"006AfEgvgy13gw42p1oxyh5j3wx731v4qp"
  pic_id: string
  // 图片的状态，如 1
  pic_status: number
}
// 图片的分辨率、地址
type PicInfo = {
  url: string;
  width: number;
  height: number;
}

type User = {
  id: number
  idstr: string
  // 博主名，如"XX"
  screen_name: string
  // 头像地址（大）
  avatar_large: string
  // 头像图片地址（可能上传时的原图）
  avatar_hd: string
  // 是否关注了“我”
  follow_me: boolean
  // “我”是否已关注该博主
  following: boolean
}

// 获取图集列表的信息
type PostsPayload = {
  // 最新的进度（图集的 ID）
  last: string | undefined,
  // 图集列表，如果为空集则不能保存最新的进度信息到存储
  posts: Album[]
}
// 根据平台，获取指定用户的图集列表
const sites = {
  weibo: {
    /**
     * 返回微博的图集列表
     * 获取图集是从第一页，所以 idstr 是从大到小减序
     * 而在实际下载中，是按从小到大增序下载，这样可以保证：
     * 1. 获取图集时，当遇到微博ID为上次任务保存的ID时，说明获取完成，可以停止获取该用户的微博
     * 2. 下载图集时，后端可在下载每个图集后保存ID，当发生异常时，继续下载
     * @param task 需下载图片的任务
     */
    async getPosts(task: Task): Promise<PostsPayload> {
      let postsList: Album[] = []
      let page = 1
      let lastIdstr = task.last
      while (true) {
        // 获取数据、解析
        // feature 为 0 表示获取原贴+转帖；为 1 表示只获取原贴
        let url = `https://weibo.com/ajax/statuses/mymblog?uid=${task.uid}&page=${page}&feature=0`
        let resp = await request(url)
        let obj: WBList = await resp.json().catch(e => {
          console.log(`[${task.plat}][${task.uid}] 获取图集地址出错，可能需要登录一次网站：`, e)
          message.error(`[${task.plat}][${task.uid}] 获取图集地址出错，可能需要登录一次网站`)
        })

        // 出错时，返回空的图集列表，表示没有新图集或获取失败，不能保存最新进度到存储
        if (!obj) {
          return {last: lastIdstr, posts: []}
        }
        // 不再包含图集时，退出循环
        if (obj.data.list.length === 0) {
          console.log(`[${task.plat}][${task.uid}] 已获取完最新图集`)
          return {last: lastIdstr, posts: postsList}
        }

        // 提取图片的下载链接
        for (const [index, item] of obj.data.list.entries()) {
          // 当读取的帖子的 idstr 等于或小于已保存的进度记录，说明已读取到上次的地方，直接返回数据
          if (task.last && item.idstr.localeCompare(task.last) <= 0) {
            return {last: lastIdstr, posts: postsList}
          }

          // 保存第一页的第一个帖子的 idstr，将作为进度存储到 chromium storage
          if (page === 1 && index === 0) {
            lastIdstr = item.idstr
          }

          // 按分辨率存储图片的地址
          const album: Array<string> = []
          const albumM: Array<string> = []

          // 如果主贴中图集为空，而 retweeted_status 不为空，说明为转贴，从原贴中获取图集数据
          let payload = item
          if (item.pic_ids.length === 0 && item.retweeted_status) {
            payload = item.retweeted_status
          }
          for (const picId of payload.pic_ids) {
            if (!payload.pic_infos[picId] || payload.pic_infos[picId].largest.url.length === 0) {
              continue
            }
            album.push(payload.pic_infos[picId].largest.url)
            albumM.push(payload.pic_infos[picId].original.url)
          }
          // 微博的标题、创建时间
          let caption = payload.text_raw.replace(/[\s\u200B-\u200D\uFEFF]/g, "") +
            `\nFrom: ${payload.mblogid}`
          let created = new Date(payload.created_at).getTime() / 1000

          // 添加图集到数组
          postsList.push({
            plat: "weibo",
            uid: task.uid,
            id: payload.idstr,
            caption: caption,
            created: created,
            urls: album,
            urls_m: albumM
          })
          // console.log(PicSaveBG.TAG, "[微博]", "已添加图集：", item.idstr);
        }

        console.log(`[${task.plat}][${task.uid}] 已添加第 ${page} 页的图集`)
        page++

        await sleep(Math.random() * 3 * 1000)
      }
    }
  }
}

// 发送下载请求
// 新下载、重试下载失败的图集（此时 albums 需传递为 []）
const sendToDL = async (path: string, albums: Array<Album>): Promise<boolean> => {
  // 从设置中读取服务端信息，以实际发送下载请求
  let dataSettings = await chrome.storage.sync.get({settings: {vps: {}}})
  let vps = dataSettings.settings.vps
  if (!vps.domain || !vps.auth) {
    console.log("VPS 信息为空，无法发送下载图集的请求")
    message.warn("VPS 信息为空，无法发送下载图集的请求")
    return false
  }

  // 操作授权码
  let t = new Date().getTime()
  let s = await sha256(vps.auth + t + vps.auth)

  let resp = await request(`${vps.domain}${path}?t=${t}&s=${s}`, albums)
    .catch(e => console.log("发送下载图集的请求出错", e))
  if (!resp) {
    message.error("发送下载图集的请求出错")
    return false
  }

  // 解析响应结果
  let result = await resp.json().catch(e => console.log("解析下载图集的响应出错：", e))
  if (!result || result.code !== 0) {
    message.error("提交下载图集出错")
    return false
  }

  console.log("已提交图集下载的任务")
  message.success("已提交图集下载的任务")
  return true
}

/**
 * 下载图集列表到本地
 * 可在 .then()中执行获取完**所有**任务后的操作
 */
export const startDLPics = async function (setWorking: React.Dispatch<React.SetStateAction<boolean>>) {
  setWorking(true)
  let albums: Array<Album> = []
  // 读取 chromium 存储的数据
  let data = await chrome.storage.sync.get({picTasks: {list: []}})
  let picTasks: StorePic = data.picTasks

  // 获取用户的图集
  for (const task of data.picTasks.list) {
    // @ts-ignore
    let payload: PostsPayload = await sites[task.plat].getPosts(task)
    // 当图集数量为空时，不能保存最新的进度信息到存储
    if (payload.posts.length === 0) {
      console.log(`[${task.plat}][${task.uid}] 没有新图集，不需保存进度`)
      message.info(`[${task.plat}][${task.uid}] 没有新图集`)
      continue
    }

    let index = picTasks.list.findIndex(v => v.plat === task.plat && v.uid === task.uid)
    if (index >= 0) {
      picTasks.list[index].last = payload.last
    } else {
      console.log(`[${task.plat}][${task.uid}] 找不到索引，无法保存进度`)
      message.error(`[${task.plat}][${task.uid}] 找不到索引`)
      continue
    }

    albums.push(...payload.posts)

    console.log(`[${task.plat}][${task.uid}] 已完成读取图集`)
  }

  // 判断是否有新图集需要下载
  if (albums.length === 0) {
    console.log("获取图集的数量为 0，不需下载")
    message.info("获取图集的数量为 0，不需下载")
    setWorking(false)
    return
  }

  // 将图集数据保存到本地，同时发送下载请求
  download(JSON.stringify(albums, null, 2), `pics_tasks_${Date.now()}.json`)

  let success = await sendToDL("/api/pics/dl", albums)
  if (success) {
    // 存储该任务的进度，之所以重读存储，是避免当执行任务时对该扩展进行设置而无效的问题
    let sData = await chrome.storage.sync.get({picTasks: {list: []}})
    sData.picTasks.list = picTasks.list
    chrome.storage.sync.set({picTasks: sData.picTasks})
  }
  setWorking(false)
}

/**
 * 重试之前下载失败的图集
 */
export const startRetry = () => {
  sendToDL("/api/pics/dl/retry", [])
}

// 清除所有任务的进度
export const clearProcess = async function () {
  // 读取 chromium 存储的数据
  let data = await chrome.storage.sync.get({picTasks: {list: []}})
  let picTasks: StorePic = data.picTasks

  delRevoke<StorePic>("所有任务的进度", picTasks, () => {
    for (let task of picTasks.list) {
      task.last = undefined
    }
    chrome.storage.sync.set({picTasks: picTasks})
  }, async (deledData) => {
    let data = await chrome.storage.sync.get({picTasks: {list: []}})
    let picTasks: StorePic = data.picTasks
    picTasks.list = deledData.list
    chrome.storage.sync.set({picTasks: picTasks})
  })
}