import React, {useEffect, useState} from 'react'
import {Button, Card, Input, message, Modal, Popconfirm, Upload} from "antd"
import {UploadOutlined} from '@ant-design/icons'
import {download, Log} from "../../comm/utils"
import './Options.css'
import {delRevoke} from "../../comm/antd"

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
    // 读取存储的数据，显示
    chrome.storage.sync.get({wxToken: {}}).then(data => {
      Log.debug("读取存储的微信 Token")
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
            Log.debug("已保存 微信测试号推送的 Token")
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
              Log.debug("已删除 微信测试号的推送 Token")
              message.warn("已删除 微信测试号的推送 Token")
            })
          }, (data) => {
            // 撤销删除，恢复数据到 chromium storage 中
            chrome.storage.sync.set({wxToken: data}, () => {
              Log.debug("已保存 微信测试号的推送 Token")
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
      Log.debug("读取存储的TG Token")
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
            Log.debug("已保存 TG机器人的推送 Token")
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
              Log.debug("已删除 TG机器人的推送 Token")
              message.warn("已删除 TG机器人的推送 Token")
            })
          }, (data) => {
            // 撤销删除，恢复到 chromium storage
            chrome.storage.sync.set({tgToken: data}, () => {
              Log.debug("已保存 TG机器人的推送 Token")
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

// 导入、保存数据
function DataPanel(): JSX.Element {
  return (
    <Card title="Chromium Storage" size="small" style={{width: 300}}>
      <div className="col margin-v-sub">
        <Upload beforeUpload={async file => {
          // 解析数据
          let data: { sync?: object, local?: object } = {}
          let text = await file.text()
          try {
            data = JSON.parse(text)
          } catch (e) {
            console.log("导入数据出错，无法解析 JSON 文本：", e)
            message.error("无法解析 JSON 文本")
          }

          // 分别恢复到 sync、local 存储
          // @ts-ignore
          await chrome.storage.sync.set(data.sync).then(message.success("已导入 需要同步的数据"))
          // @ts-ignore
          await chrome.storage.local.set(data.local).then(message.success("已导入 不需要同步的数据"))

          // 刷新组件
          window.location.reload()
          // 取消上传文件的操作
          return false
        }}>
          <Button type="primary" icon={<UploadOutlined/>}>从文件导入配置</Button>
        </Upload>

        <Button type="primary" onClick={async _ => {
          // 读取数据
          let sync = await chrome.storage.sync.get(null)
          let local = await chrome.storage.local.get(null)
          let data = {sync: sync, local: local}
          Modal.info({
            title: "Chromium Storage 存储的数据",
            content: JSON.stringify(data),
            maskClosable: true,
            bodyStyle: {height: 450, overflow: "auto"}
          })
        }}>浏览配置</Button>

        <Button type="primary" onClick={async _ => {
          // 读取数据
          let sync = await chrome.storage.sync.get(null)
          let local = await chrome.storage.local.get(null)
          let data = {sync: sync, local: local}

          // 下载
          download(data, "chromium-task.json")
        }}>下载配置</Button>

        <Popconfirm
          placement="bottom"
          title="确定清除存储的配置"
          onConfirm={async _ => {
            // 清空存储的配置
            await chrome.storage.sync.clear()
            await chrome.storage.local.clear()
            // 刷新组件
            window.location.reload()
          }}
          okText="确定清除"
          cancelText="取消">
          <Button type="primary" danger>清空配置</Button>
        </Popconfirm>
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
      <DataPanel/>
    </div>
  )
}

export default OptionsComp
