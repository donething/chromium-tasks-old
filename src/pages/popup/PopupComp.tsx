import React from 'react'
import './Popup.css'
import {Button} from "antd"

function PopupComp() {
  return (
    <div className="col" style={{backgroundColor: "#FFF"}}>
      <Button type="link" onClick={() =>
        chrome.tabs.create({url: "/index.html#/attentions"})}>关注
      </Button>
      <Button type="link" onClick={() =>
        chrome.tabs.create({url: "/index.html#/matches"})}>比赛
      </Button>
      <Button type="link" onClick={() =>
        chrome.tabs.create({url: "/index.html#/options"})}>选项
      </Button>
    </div>
  )
}

export default PopupComp
