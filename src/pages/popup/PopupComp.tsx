import React, {useEffect} from 'react'
import {Button, Space} from "antd"

function PopupComp() {
  useEffect(() => {
    document.title = `弹出框 - ${chrome.runtime.getManifest().name}`
  }, [])

  return (
    <Space direction="vertical" style={{width: 80, padding: 5}}>
      <span className="clickable" onClick={() =>
        chrome.tabs.create({url: "/index.html#/attentions"})}>关注
      </span>

      <span className="clickable" onClick={() =>
        chrome.tabs.create({url: "/index.html#/matches"})}>赛程
      </span>

      <span className="clickable" onClick={() =>
        chrome.tabs.create({url: "/index.html#/tasks"})}>任务记录
      </span>

      <span className="clickable" onClick={() =>
        chrome.tabs.create({url: "/index.html#/pics"})}>图片下载
      </span>

      <span className="clickable" onClick={() =>
        chrome.tabs.create({url: "/index.html#/options"})}>选项
      </span>
    </Space>
  )
}

export default PopupComp
