import {VPanel} from "../../components/vpanel"
import React, {useEffect, useState} from "react"
import {Button, message} from "antd"
import {CloseOutlined, DownloadOutlined} from "@ant-design/icons"
import {OptionInput} from "../../components/option_input"
import {delItemRevoke2} from "../../comm/antd"
import startDLPics from "./task"

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

// 网站 合集
const sites = {
  weibo: {
    logo: "/icons/websites/weibo.svg",
    getURL: (uid: string) => `https://weibo.com/u/${uid}`
  }
}

// 图片任务项
const TaskItem = function (props: { uid: string, plat: string, onDel: () => void }) {
  // @ts-ignore
  let logo = sites[props.plat].logo
  // @ts-ignore
  let url = sites[props.plat].getURL(props.uid)
  return (
    <li className="row padding align-center justify-between border-bottom">
      <a className="row align-center" title={props.uid} href={url} target="_blank" rel="noreferrer">
        <img className="avatar margin-right" title={props.plat} alt={props.plat} src={logo}/>
        <span>{props.uid}</span>
      </a>

      <span className="row align-center">
        <Button title="删除" icon={<CloseOutlined/>} shape="circle" size="small" onClick={_ => props.onDel()}/>
      </span>
    </li>
  )
}

// 图片的平台、ID 组件
const PicTaskComp = function (): JSX.Element {
  const [tasks, setTasks] = useState<Array<Task>>([])

  useEffect(() => {
    document.title = `图片下载 - ${chrome.runtime.getManifest().name}`

    const init = async () => {
      let data = await chrome.storage.sync.get({picTasks: {list: []}})
      setTasks(data.picTasks.list)
    }
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
  let options = [[
    {title: "微博", value: "weibo", tip: "用户的 ID"}
  ]]

  return (
    <VPanel title="图片任务列表"
            content={<ul>{tasksList}</ul>}
            slot={<Button title="下载图集" icon={<DownloadOutlined/>} shape="circle" size="small"
                          onClick={startDLPics}/>}
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
  )
}

export default PicTaskComp
