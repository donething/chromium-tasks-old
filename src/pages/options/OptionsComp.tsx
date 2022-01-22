import React, {useEffect, useState} from 'react'
import {Button, Card, Input, message} from "antd"
import {BackupPanel, delRevoke} from "../../comm/antd"

// 微信 Token
const WXToken = function (): JSX.Element {
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
    chrome.storage.sync.get({settings: {}}).then(data => {
      console.log("读取存储的微信 Token")
      if (data.settings.wxToken) {
        setAppid(data.settings.wxToken.appid)
        setSecret(data.settings.wxToken.secret)
        setTplID(data.settings.wxToken.tplID)
        setToUID(data.settings.wxToken.toUID)
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
        <Button type="primary" onClick={async _ => {
          if (!token.appid || !token.secret || !token.toUID || !token.tplID) {
            message.info("输入的信息中有部分为空")
            return
          }
          let data = await chrome.storage.sync.get({settings: {}})
          data.settings.wxToken = token
          chrome.storage.sync.set({settings: data.settings}, () => {
            console.log("已保存 微信测试号推送的 Token")
            message.success("已保存 微信测试号的推送 Token")
          })
        }}>保存 Token
        </Button>

        <Button type="primary" danger onClick={_ => {
          delRevoke("微信测试号的推送 Token", token, async () => {
            // 删除输入框绑定的数据
            setAppid("")
            setSecret("")
            setTplID("")
            setToUID("")

            // 保存到 chromium storage
            let data = await chrome.storage.sync.get({settings: {}})
            data.settings.wxToken = undefined
            chrome.storage.sync.set({settings: data.settings.wxToken}).then(() => {
              console.log("已删除 微信测试号的推送 Token")
              message.warn("已删除 微信测试号的推送 Token")
            })
          }, async (deledData) => {
            // 撤销删除，恢复数据到 chromium storage 中
            let data = await chrome.storage.sync.get({settings: {}})
            data.settings.wxToken = deledData
            chrome.storage.sync.set({settings: data.wxToken}, () => {
              console.log("已保存 微信测试号的推送 Token")
              message.success("已保存 微信测试号的推送 Token")
            })

            // 恢复输入框绑定的数据
            setAppid(deledData.appid)
            setSecret(deledData.secret)
            setTplID(deledData.tplID)
            setToUID(deledData.toUID)
          })
        }}>删除 Token
        </Button>
      </div>
    </Card>
  )
}

// TG Token
const TGToken = function (): JSX.Element {
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
    chrome.storage.sync.get({settings: {tgToken: {}}}).then(data => {
      console.log("读取存储的TG Token")
      if (data.settings.tgToken) {
        setPicChatID(data.settings.tgToken.picChatID)
        setPicToken(data.settings.tgToken.picToken)
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
        <Button type="primary" onClick={async _ => {
          if (!token.picChatID || !token.picToken) {
            message.info("输入的信息中有部分为空")
            return
          }

          let data = await chrome.storage.sync.get({settings: {}})
          data.settings.tgToken = token
          chrome.storage.sync.set({settings: data.settings}, () => {
            console.log("已保存 TG机器人的推送 Token")
            message.success("已保存 TG机器人的推送 Token")
          })
        }}>保存 Token
        </Button>

        <Button type="primary" danger onClick={_ => {
          delRevoke(`TG机器人的推送 Token`, token, async () => {
            // 删除输入框绑定的数据
            setPicChatID("")
            setPicToken("")

            // 保存到 chromium storage
            let data = await chrome.storage.sync.get({settings: {}})
            data.settings.tgToken = undefined
            chrome.storage.sync.set({settings: data.settings}).then(() => {
              console.log("已删除 TG机器人的推送 Token")
              message.warn("已删除 TG机器人的推送 Token")
            })
          }, async (deleddata) => {
            // 撤销删除，恢复到 chromium storage
            let data = await chrome.storage.sync.get({settings: {}})
            data.settings.tgToken = token
            chrome.storage.sync.set({settings: data.settings}, () => {
              console.log("已保存 TG机器人的推送 Token")
              message.success("已保存 TG机器人的推送 Token")
            })

            // 恢复输入框绑定的数据
            setPicChatID(deleddata.picChatID)
            setPicToken(deleddata.picToken)
          })
        }}>删除 Token
        </Button>
      </div>
    </Card>
  )
}

// VPS 参数
const VPS = function (): JSX.Element {
  // VPS 的域名、验证码
  const [domain, setDomain] = useState("")
  const [auth, setAuth] = useState("")

  // 将存储
  const vps = {
    domain: domain?.trim(),
    auth: auth?.trim()
  }

  // 仅在组件被导入时读取数据，组件有变动（重新渲染）时不执行
  useEffect(() => {
    // 读取存储的数据，显示
    chrome.storage.sync.get({settings: {vps: {}}}).then(data => {
      console.log("读取存储的 VPS 信息")
      if (data.settings.vps) {
        setDomain(data.settings.vps.domain)
        setAuth(data.settings.vps.auth)
      }
    })
  }, [])

  return (
    <Card title="VPS 信息" size="small" style={{width: 300}}>
      <div className="col margin-v-sub">
        <Input.Password addonBefore="Domain" value={domain} type="password"
                        onChange={e => setDomain(e.target.value)}/>
        <Input.Password addonBefore="Auth" value={auth} type="password"
                        onChange={e => setAuth(e.target.value)}/>
      </div>

      <div className="row justify-between margin-top-large">
        <Button type="primary" onClick={async _ => {
          if (!vps.domain || !vps.auth) {
            message.info("输入的信息中有部分为空")
            return
          }

          let data = await chrome.storage.sync.get({settings: {}})
          data.settings.vps = vps
          chrome.storage.sync.set({settings: data.settings}, () => {
            console.log("已保存 VPS 信息")
            message.success("已保存 VPS 信息")
          })
        }}>保存 VPS 信息
        </Button>

        <Button type="primary" danger onClick={_ => {
          delRevoke(`VPS 信息`, vps, async () => {
            // 删除输入框绑定的数据
            setDomain("")
            setAuth("")

            // 保存到 chromium storage
            let data = await chrome.storage.sync.get({settings: {}})
            data.settings.vps = undefined
            chrome.storage.sync.set({settings: data.settings}).then(() => {
              console.log("已删除 VPS 信息")
              message.warn("已删除 VPS 信息")
            })
          }, async (deleddata) => {
            // 撤销删除，恢复到 chromium storage
            let data = await chrome.storage.sync.get({settings: {}})
            data.settings.vps = vps
            chrome.storage.sync.set({settings: data.settings}, () => {
              console.log("已保存 VPS 信息")
              message.success("已保存 VPS 信息")
            })

            // 恢复输入框绑定的数据
            setDomain(deleddata.domain)
            setAuth(deleddata.auth)
          })
        }}>删除 VPS 信息
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
      <VPS/>
      <BackupPanel/>
    </div>
  )
}

export default OptionsComp
