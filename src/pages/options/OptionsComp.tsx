import React, {useEffect, useState} from 'react'
import {Button, Card, Input, message} from "antd"
import {BackupPanel, delRevoke} from "../../comm/antd"

// 微信 Token
function WXToken(): JSX.Element {
  const [appid, setAppid] = useState("")
  const [secret, setSecret] = useState("")
  const [tplID, setTplID] = useState("")
  const [toUID, setToUID] = useState("")

  // 将存储
  const token = {
    appid: appid?.trim(),
    secret: secret?.trim(),
    tplID: tplID?.trim(),
    toUID: toUID?.trim()
  }

  // 仅在组件被导入时读取数据，组件有变动（重新渲染）时不执行
  useEffect(() => {
    document.title = `选项 - ${chrome.runtime.getManifest().name}`

    // 读取存储的数据，显示
    chrome.storage.sync.get({wxToken: {}}).then(data => {
      console.log("读取存储的微信 Token")
      if (data.wxToken) {
        setAppid(data.wxToken.appid)
        setSecret(data.wxToken.secret)
        setTplID(data.wxToken.tplID)
        setToUID(data.wxToken.toUID)
      }
    })
  }, [])

  return (
    <Card title="微信测试号的推送 Token" size="small" style={{width: 300}}>
      <div className="col margin-v-sub">
        <Input.Password addonBefore="appid" value={appid} type="password"
                        onChange={e => setAppid(e.target.value)}/>
        <Input.Password addonBefore="secret" value={secret} type="password"
                        onChange={e => setSecret(e.target.value)}/>
        <Input.Password addonBefore="tid" value={tplID} type="password"
                        onChange={e => setTplID(e.target.value)}/>
        <Input.Password addonBefore="uid" value={toUID} type="password"
                        onChange={e => setToUID(e.target.value)}/>
      </div>

      <div className="row justify-between margin-top-large">
        <Button type="primary" onClick={_ => {
          if (!token.appid || !token.secret || !token.toUID || !token.tplID) {
            message.info("输入的信息中有部分为空")
            return
          }
          chrome.storage.sync.set({wxToken: token}, () => {
            console.log("已保存 微信测试号推送的 Token")
            message.success("已保存 微信测试号的推送 Token")
          })
        }}>保存 Token
        </Button>

        <Button type="primary" danger onClick={async _ => {
          delRevoke("微信测试号的推送 Token", token, () => {
            // 删除输入框绑定的数据
            setAppid("")
            setSecret("")
            setTplID("")
            setToUID("")

            // 保存到 chromium storage
            chrome.storage.sync.remove("wxToken").then(() => {
              console.log("已删除 微信测试号的推送 Token")
              message.warn("已删除 微信测试号的推送 Token")
            })
          }, (data) => {
            // 撤销删除，恢复数据到 chromium storage 中
            chrome.storage.sync.set({wxToken: data}, () => {
              console.log("已保存 微信测试号的推送 Token")
              message.success("已保存 微信测试号的推送 Token")
            })

            // 恢复输入框绑定的数据
            setAppid(data.appid)
            setSecret(data.secret)
            setTplID(data.tplID)
            setToUID(data.toUID)
          })
        }}>删除 Token
        </Button>
      </div>
    </Card>
  )
}

// TG Token
function TGToken(): JSX.Element {
  const [picChatID, setPicChatID] = useState("")
  const [picToken, setPicToken] = useState("")

  // 将存储
  const token = {
    picChatID: picChatID?.trim(),
    picToken: picToken?.trim(),
  }

  // 仅在组件被导入时读取数据，组件有变动（重新渲染）时不执行
  useEffect(() => {
    // 读取存储的数据，显示
    chrome.storage.sync.get({tgToken: {}}).then(data => {
      console.log("读取存储的TG Token")
      if (data.tgToken) {
        setPicChatID(data.tgToken.picChatID)
        setPicToken(data.tgToken.picChatID)
      }
    })
  }, [])

  return (
    <Card title="TG机器人推送 Token" size="small" style={{width: 300}}>
      <div className="col margin-v-sub">
        <Input.Password addonBefore="picChatID" value={picChatID} type="password"
                        onChange={e => setPicChatID(e.target.value)}/>
        <Input.Password addonBefore="picToken" value={picToken} type="password"
                        onChange={e => setPicToken(e.target.value)}/>
      </div>

      <div className="row justify-between margin-top-large">
        <Button type="primary" onClick={_ => {
          if (!token.picChatID || !token.picToken) {
            message.info("输入的信息中有部分为空")
            return
          }
          chrome.storage.sync.set({tgToken: token}, () => {
            console.log("已保存 TG机器人的推送 Token")
            message.success("已保存 TG机器人的推送 Token")
          })
        }}>保存 Token
        </Button>

        <Button type="primary" danger onClick={async _ => {
          delRevoke(`TG机器人的推送 Token`, token, () => {
            // 删除输入框绑定的数据
            setPicChatID("")
            setPicToken("")

            // 保存到 chromium storage
            chrome.storage.sync.remove("tgToken").then(() => {
              console.log("已删除 TG机器人的推送 Token")
              message.warn("已删除 TG机器人的推送 Token")
            })
          }, (data) => {
            // 撤销删除，恢复到 chromium storage
            chrome.storage.sync.set({tgToken: data}, () => {
              console.log("已保存 TG机器人的推送 Token")
              message.success("已保存 TG机器人的推送 Token")
            })

            // 恢复输入框绑定的数据
            setPicChatID(data.picChatID)
            setPicToken(data.picToken)
          })
        }}>删除 Token
        </Button>
      </div>
    </Card>
  )
}

// 选项页
function OptionsComp() {
  return (
    <div className="row wrap">
      <WXToken/>
      <TGToken/>
      <BackupPanel/>
    </div>
  )
}

export default OptionsComp
