import {VPanel} from "../../components/vpanel"
import React, {CSSProperties, useEffect, useState} from "react"
import {Avatar, Button, Card, message, Space} from "antd"
import Icon, {CloseOutlined, DownloadOutlined, ClearOutlined} from "@ant-design/icons"
import {ReactComponent as IconWeibo} from "../../icons/weibo.svg"
import {OptionInput} from "../../components/option_input"
import {delItemRevoke2} from "../../comm/antd"
import {request} from "do-utils"
import {clearProcess, startDLPics, startRetry} from "./task"
import {sha256} from "do-utils/dist/text"

// 存储到 chromium storage 的数据，键为"picTasks"
export type StorePic = {
  // 是否启用任务，默认启用
  enable?: boolean
  list: Array<Task>
}

// 单个图片任务
export type Task = {
  // 平台，如"weibo"
  plat: string
  // 用户 ID，如"123456"
  uid: string
  // 已爬取图片的最近一条微博的 ID，如"4563128419479174"
  last?: string
}

// 用户信息
type UserInfo = {
  name: string
  avatar: string
  description: string
}

// 网站 合集
const sites = {
  weibo: {
    logo: IconWeibo,
    getURL: (uid: string) => `https://weibo.com/u/${uid}`
  }
}

// 图片任务项
const TaskItem = (props: { uid: string, plat: string, onDel: () => void }): JSX.Element => {
  // 用户的信息，用于显示
  const [userInfo, setUserInfo] = useState<UserInfo>({name: "", avatar: "", description: ""})

  // 初始化
  const init = async () => {
    // 获取用户信息
    // @see https://www.jianshu.com/p/7f3b72c08f77
    const apiUrl = `https://m.weibo.cn/api/container/getIndex?containerid=100505${props.uid}`
    let resp = await request(apiUrl)
    let obj = await resp.json()
    let info = {
      name: obj.data.userInfo.screen_name,
      avatar: obj.data.userInfo.avatar_hd,
      description: obj.data.userInfo.description
    }
    setUserInfo(info)
  }

  useEffect(() => {
    init()
  }, [])

  // @ts-ignore
  let platLogo = sites[props.plat].logo
  // @ts-ignore
  let homePageUrl = sites[props.plat].getURL(props.uid)
  return (
    <li className="row padding align-center border-bottom">
      <Avatar size={18} src={userInfo.avatar}/>
      <a className="margin-left overflow-hide-line-one" title={userInfo.description} rel="noreferrer"
         href={homePageUrl} target="_blank">{`${userInfo.name} (${props.uid})`}
      </a>
      <Icon className="margin-left" title={props.plat} alt={props.plat} component={platLogo}/>

      <span className="row align-center put-right">
        <Button title="删除" icon={<CloseOutlined/>} shape="circle" size="small" onClick={_ => props.onDel()}/>
      </span>
    </li>
  )
}

// 远程服务端的状态组件
const Remote = (props: { style?: CSSProperties }): JSX.Element => {
  const [connOK, setConnOK] = useState<boolean | undefined>(undefined)
  const [domain, setDomain] = useState("")

  useEffect(() => {
    const init = async () => {
      // 从设置中读取服务端信息
      let dataSettings = await chrome.storage.sync.get({settings: {vps: {}}})
      let vps = dataSettings.settings.vps
      if (!vps.domain || !vps.auth) {
        console.log("VPS 服务端信息为空，无法连接到服务端")
        message.warn("VPS 服务端信息为空，无法连接到服务端")
        return
      }

      // 配置服务端域名
      setDomain(vps.domain)

      // 更新连接服务端的状态
      // 操作授权码
      let t = new Date().getTime()
      let s = await sha256(vps.auth + t + vps.auth)

      let resp = await request(`${vps.domain}/api/pics/dl/status?t=${t}&s=${s}`).catch((e) => {
        console.error("无法连接服务端：", e)
        message.error("无法连接服务端")
        setConnOK(false)
      })
      if (!resp) return

      let obj = await resp.json().catch((e) => {
        console.error("服务端响应的内容有误：", e)
        message.error("服务端响应的内容有误")
        setConnOK(false)
      })
      if (!obj) return

      setConnOK(obj?.code === 0)
      console.log("服务端返回状态：", obj)
    }

    init()
  }, [])

  // 使用不同颜色、文本标记是否可连接服务端
  let mark = connOK === true ? "success-text" : connOK === false ? "focus-text" : ""
  let text = connOK === true ? "正常" : connOK === false ? "无法连接" : "未知"

  return (
    <Card title="服务端状态" size="small" style={{...props.style}}
          extra={<span title="服务端的连接状态" className={mark}>{text}</span>}>
      <Space direction="vertical">
        <Button title="查看服务端的下载状态" size="small" onClick={() => {
          window.open(`${domain}/#/tasks`, "_blank")
        }}>下载进度</Button>
        <Button title="重试之前下载失败的图集" size="small" onClick={() => startRetry()}>重试失败</Button>
      </Space>
    </Card>
  )
}

// 图片的平台、ID 组件
const PicTaskComp = function (): JSX.Element {
  const [tasks, setTasks] = useState<Array<Task>>([])
  const [working, setWorking] = useState(false)

  const init = async () => {
    let data = await chrome.storage.sync.get({picTasks: {list: []}})
    setTasks(data.picTasks.list)
  }

  useEffect(() => {
    document.title = `图片下载 - ${chrome.runtime.getManifest().name}`

    // 执行
    init()
  }, [])

  const tasksList = tasks.map(task =>
    <TaskItem uid={task.uid} plat={task.plat} onDel={() => {
      let index = tasks.findIndex(v => v.uid === task.uid && v.plat === task.plat)
      delItemRevoke2(`${task.uid}(${task.plat})`, tasks, index, async (data) => {
        setTasks(data)

        let storage = await chrome.storage.sync.get({picTasks: {}})
        storage.picTasks.list = data
        chrome.storage.sync.set({picTasks: storage.picTasks})
      })
    }}/>
  )

  // 输入框的选项
  let options = [[{title: "微博", value: "weibo", tip: "用户的 ID"}]]

  return (
    <div className="row">
      <VPanel title="图集任务列表"
              content={<ul>{tasksList}</ul>}
              slot={<Space direction="horizontal">
                <Button title="删除进度" icon={<ClearOutlined/>} shape="circle" size="small"
                        onClick={() => clearProcess()}/>
                <Button title="下载图集" icon={<DownloadOutlined/>} shape="circle" size="small" disabled={working}
                        onClick={() => startDLPics(setWorking)}/>
              </Space>}
              footer={<OptionInput placeholder={"用户 ID"} enterButton="添加" size="small"
                                   optionsList={options}
                                   onSearch={async (v, sList) => {
                                     if (!v || !sList[0]) return

                                     // 用来更新界面
                                     let nItem = {plat: sList[0], uid: v}
                                     setTasks(prev => [...prev, nItem])

                                     // 保存到存储
                                     let storage = await chrome.storage.sync.get({picTasks: {list: []}})
                                     storage.picTasks.list.push(nItem)
                                     chrome.storage.sync.set({picTasks: storage.picTasks})

                                     console.log("已添加新的图片任务：", JSON.stringify(nItem))
                                     message.success("已添加新的图片任务")
                                   }}/>}
      />
      <Remote style={{width: 300, marginLeft: 10}}/>
    </div>
  )
}

export default PicTaskComp
