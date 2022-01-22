import {VPanel} from "../../components/vpanel"
import React, {useEffect, useState} from "react"
import {Avatar, Button, message, Space} from "antd"
import Icon, {CloseOutlined, DownloadOutlined} from "@ant-design/icons"
import {ReactComponent as IconWeibo} from "../../icons/weibo.svg"
import {OptionInput} from "../../components/option_input"
import {delItemRevoke2} from "../../comm/antd"
import startDLPics from "./task"
import {request} from "do-utils"

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
const TaskItem = function (props: { uid: string, plat: string, onDel: () => void }) {
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
    <Space direction="horizontal">
      <VPanel title="图集任务列表"
              content={<ul>{tasksList}</ul>}
              slot={<Button title="下载图集" icon={<DownloadOutlined/>} shape="circle" size="small" disabled={working}
                            onClick={() => startDLPics(setWorking)}/>}
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
    </Space>
  )
}

export default PicTaskComp
