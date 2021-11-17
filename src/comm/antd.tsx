import {Button, notification} from "antd"

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
