import React, {useEffect} from 'react'
import {Button} from "antd"

function PopupComp() {
  useEffect(() => {
    document.title = `弹出框 - ${chrome.runtime.getManifest().name}`
  }, [])

  return (
    <div className="col" style={{backgroundColor: "#FFF"}}>
      <Button type="link" onClick={() =>
        chrome.tabs.create({url: "/index.html#/attentions"})}>关注
      </Button>

      <Button type="link" onClick={() =>
        chrome.tabs.create({url: "/index.html#/matches"})}>赛程
      </Button>

      <Button type="link" onClick={() =>
        chrome.tabs.create({url: "/index.html#/tasks"})}>任务记录
      </Button>

      <Button type="link" onClick={() =>
        chrome.tabs.create({url: "/index.html#/pics"})}>图片下载
      </Button>

      <Button type="link" onClick={() =>
        chrome.tabs.create({url: "/index.html#/options"})}>选项
      </Button>
    </div>
  )
}

export default PopupComp
