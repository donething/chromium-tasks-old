import {Button, Card, message, Modal, notification, Popconfirm, Upload} from "antd"
import {UploadOutlined} from "@ant-design/icons"
import {download} from "do-utils"
import React, {CSSProperties} from "react"
import {CardSize} from "antd/es/card"

/**
 * 删除数组中的元素，并提供撤销功能
 * @param title 已删除元素的标题（如主播的房间名），不需要完整提示（如“已删除，是否撤销”）
 * @param  data 数据的数组，如 chromium storage 中存储的数组数据
 * @param iDelData 待删除的数据元素的索引
 * @param save 保存修改到 chromium storage 的回调函数
 * @param infos 待删除数据的信息的数组（如当 data 是主播的 id 列表，该数组是获取的主播信息列表，当删除一个主播的 id 时，
 * 也需要删除此数组中相应的信息）
 * @param iDelInfo 待删除的数据的信息的索引
 * @param update 更新界面数据的回调函数
 */
export const delItemRevoke = function <T, V>(title: string,
                                             data: Array<T>, iDelData: number,
                                             save: (data: Array<T>) => void,
                                             infos: Array<V>, iDelInfo: number,
                                             update: (infos: Array<V>) => void) {
  // 如果待删除项目的索引小于0，直接返回
  if (iDelData < 0) return
  // 删除项目，返回的是数组
  let deledItems = data.splice(iDelData, 1)
  // 保存修改到 chromium storage
  save(data)

  // 删除项目的信息
  let infosNew = [...infos]
  let deledInfos = infosNew.splice(iDelInfo, 1)
  // 更新界面数据
  update(infosNew)
  console.log(`已删除项目："${title}"`)

  // 提供撤销功能
  let key = `open_${Date.now()}`
  let btn = (
    <Button type="primary" onClick={() => {
      // 恢复 chromium storage 的数据
      data.splice(iDelData, 0, deledItems[0])
      save(data)

      // 恢复界面数据
      let infosRevoke = [...infosNew]
      infosRevoke.splice(iDelInfo, 0, deledInfos[0])
      update(infosRevoke)
      notification.close(key)
      console.log(`已恢复项目："${title}"`)
    }}>
      撤销删除
    </Button>
  )

  // 弹出撤销操作的通知
  let options = {
    message: "是否撤销删除", description: `已删除项目：${title}`, key: key, btn: btn
  }
  notification.open(options)
}


/**
 * 删除项目，并提供撤销功能
 * @param title 已删除元素的标题（如主播的房间名），不需要完整提示（如“已删除，是否撤销”）
 * @param data 需要删除的数据，如 chromium storage 中存储的对象
 * @param remove 删除组件绑定的状态，并保存更改到 chromium storage 中
 * @param revoke 撤销删除，根据参数恢复组件绑定的状态，并将恢复的数据保存到 chromium storage 中
 */
export const delRevoke = function <T>(title: string, data: T, remove: () => void, revoke: (data: T) => void) {
  // 预先保存被删除的信息，以供撤销删除
  let deledData = JSON.stringify(data)

  // 开始正常删除信息（因为响应式，同时更新了界面）
  // 同时也要保存修改到 chromium storage
  remove()
  console.log(`已删除项目："${title}"`)

  // 提供撤销功能
  let key = `open_${Date.now()}`
  let btn = (
    <Button type="primary" onClick={() => {
      revoke(JSON.parse(deledData))
      notification.close(key)
      console.log(`已恢复项目："${title}"`)
    }}>
      撤销删除
    </Button>
  )

  // 弹出撤销操作的通知
  let options = {
    message: "是否撤销删除", description: `已删除项目：${title}`, key: key, btn: btn
  }
  notification.open(options)
}


// 备份、导入 chromium storage 数据的属性
type BackupPanelProps = {
  // 保存配置到本地时的文件名
  filename?: string
  // 卡片的标题
  title?: string
  // 卡片的尺寸
  size?: CardSize
  // 卡片的样式
  style?: CSSProperties
}
// 备份、导入 chromium storage 数据
export const BackupPanel = function ({
                                       filename = chrome.runtime.getManifest().name + ".json",
                                       title = "Chromium Storage",
                                       size = "small",
                                       style = {width: 300}
                                     }: BackupPanelProps): JSX.Element {
  return (
    <Card title={title} size={size} style={style}>
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
            title: `${title} 存储的数据`,
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
          download(data, filename)
        }}>下载配置</Button>

        <Popconfirm
          placement="bottom"
          title="确定清除存储的配置，不可恢复"
          onConfirm={async _ => {
            // 清空存储的配置
            await chrome.storage.sync.clear()
            await chrome.storage.local.clear()
            // 刷新组件
            window.location.reload()
          }}
          okText="确定清除"
          cancelText="取消"
          okButtonProps={{danger: true}}>
          <Button type="primary" danger>清空配置</Button>
        </Popconfirm>
      </div>
    </Card>
  )
}