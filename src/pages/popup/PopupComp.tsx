import React, {useEffect} from 'react'
import {Space} from "antd"
import Icon from '@ant-design/icons'
import {ReactComponent as IconAttention} from "../../icons/attention.svg"
import {ReactComponent as IconMatches} from "../../icons/matches.svg"
import {ReactComponent as IconTasks} from "../../icons/tasks.svg"
import {ReactComponent as IconPics} from "../../icons/pic.svg"
import {ReactComponent as IconZuji} from "../../icons/foot.svg"
import {ReactComponent as IconOptions} from "../../icons/options.svg"

function PopupComp() {
  useEffect(() => {
    document.title = `弹出框 - ${chrome.runtime.getManifest().name}`
  }, [])

  return (
    <Space direction="vertical" style={{width: 100, padding: 5}}>
      <span className="clickable" onClick={() => chrome.tabs.create({url: "/index.html#/attentions"})}>
        <Icon component={IconAttention}/> 关注
      </span>

      <span className="clickable" onClick={() => chrome.tabs.create({url: "/index.html#/matches"})}>
         <Icon component={IconMatches}/> 赛程
      </span>

      <span className="clickable" onClick={() => chrome.tabs.create({url: "/index.html#/tasks"})}>
        <Icon component={IconTasks}/> 任务记录
      </span>

      <span className="clickable" onClick={() => chrome.tabs.create({url: "/index.html#/pics"})}>
        <Icon component={IconPics}/> 图片下载
      </span>

      <span className="clickable" onClick={() => chrome.tabs.create({url: "/index.html#/zuji"})}>
        <Icon component={IconZuji}/> 足迹直播
      </span>

      <span className="clickable" onClick={() => chrome.tabs.create({url: "/index.html#/options"})}>
        <Icon component={IconOptions}/> 选项
      </span>
    </Space>
  )
}

export default PopupComp
