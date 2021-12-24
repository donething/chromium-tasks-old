// 顶部为卡片头，中部为列表显示数据，底部为添加
import {VPanel} from "./vpanel"
import {Avatar, Button, message, Switch} from "antd"
import Icon, {CloseOutlined} from "@ant-design/icons"
import React, {useEffect, useState} from "react"
import {insertOrdered} from "do-utils/dist/utils"
import {delItemRevoke} from "../comm/antd"
import {OptionInput, OptionItem} from "./option_input"

// 列表项的参数
type ListItemProps = {
  // 主播、应用的ID
  id: string
  // 主播、应用所在的平台
  plat: string
  // 如主播、应用的图标地址
  icon: string
  // 项目名，如；主播名、应用名
  name: string,
  // 项目名的最大宽度
  nameMax: number
  // 项目的介绍
  title: string,
  // 点击标题时的跳转地址
  url: string
  // 所在平台的图标
  platIcon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
  // 备注
  comment?: string,
  // 需要特殊标记（如在线、限免，背景变色）
  isMarked?: boolean
  // 是否为新添加的项（背景变色）
  isNewAdded?: boolean

  // 是否为简洁模式
  compact: boolean
  // 检测开关的初始状态
  swChecked: boolean

  // 点击了删除按钮的回调
  onDel: () => void
  // 点击了开关按钮的回调
  onSwitch: (checked: boolean) => void
}
// 生成列表项
const ListItem = (props: ListItemProps): JSX.Element => {
  // console.log("ListItem：", props)
  return (
    <li className={"row align-center padding" +
      ` ${props.isMarked ? "is-marked" : ""} ${props.isNewAdded ? "is-new-added" : ""}`}>
      <Avatar src={props.icon} size={props.compact ? 18 : 32}/>
      <div className="col margin-left width-100per width-fill-remain">
        <div className="row">
          <span className="row align-center">
            <a title={props.id + " " + props.name} className="overflow-hide-line-one"
               href={props.url} target="_blank" rel="noreferrer" style={{maxWidth: props.nameMax}}>
              {props.name}
            </a>
            <Icon className="margin-left" component={props.platIcon}/>
            <span className="post-extra margin-left">{props.comment}</span>
          </span>
          <span className="row align-center put-right">
            <Button title="删除" icon={<CloseOutlined/>} shape="circle" size="small"
                    onClick={_ => props.onDel()}/>
            <Switch title="准许检测" checked={props.swChecked} className="margin-left" size="small"
                    onChange={checked => props.onSwitch(checked)}/>
          </span>
        </div>
        {
          !props.compact &&
          <div title={props.title} className="post-description overflow-hide-line-one margin-top">
            {props.title}
          </div>
        }
      </div>
    </li>
  )
}

/**
 * 可添加新项的列表组件
 * @param title 组件的标题
 * @param key 存储在 chromium storage sync 中数据的键
 * @param width 组件的宽度
 * @param statusUtils 获取指定平台项目的详细信息的工具，包含如主播的在播状态、平台图标信息
 * @param praseDetail 解析项目的详细信息，用于添加到列表项中
 * @param input 新项目输入框的数据，如输入提示、选择列表的选项值数组（每个数组都表示一个选择框）
 * @param parseNewItem 将输入框的内容，转换为新项
 * @param sortRule 列表项的排序规则，可空
 * @return 列表组件
 */
export const ListAddComp = function <B, D>(title: string, key: string, width: number,
                                           statusUtils: any, praseDetail: (detail: D) => any,
                                           input: {
                                             tip: string,
                                             options: Array<Array<OptionItem>>
                                           },
                                           parseNewItem: (value: string, slist: Array<string>) => B,
                                           sortRule: Array<Function>): JSX.Element {
  const [infosDetail, setInfosDetail] = useState<Array<D>>([])
  const [swCompact, setSwCompact] = useState(true)
  const [swNo, setSwNo] = useState(true)
  const [swEnable, setSwEnable] = useState(true)

  // 仅在组件被导入时读取数据，组件有变动（重新渲染）时不执行
  useEffect(() => {
    // 读取存储的数据，显示
    chrome.storage.sync.get({[key]: {}}).then(data => {
      console.log(`[${title}] 读取存储的数据：`, JSON.stringify(data[key]))
      // 设置卡片头中开关的状态
      setSwCompact(data[key].compactMode !== false)
      setSwNo(data[key].enable_notify !== false)
      setSwEnable(data[key].enable !== false)

      // 联网获取信息
      const getData = function (infosBasic: Array<B>) {
        infosBasic.map(async basic => {
          // @ts-ignore
          const status = await statusUtils[basic.plat].check(basic)
          // @ts-ignore
          console.log(`[${title}] 读取(${basic.plat} ${basic.id})的状态：`, JSON.stringify(status))
          // @ts-ignore
          let detail: D = {basic: basic, status: status}
          setInfosDetail(oldArray => insertOrdered(oldArray, detail, sortRule))
        })
      }

      if (data[key]) {
        getData(data[key].list || [])
      }
    })
  }, [])

  // 生成列表
  const listItems = infosDetail.map(detail => {
      let props = praseDetail(detail)
      return <ListItem key={`${props.plat}_${props.id}`}
                       id={props.id} plat={props.plat}
                       icon={props.icon}
                       title={props.title}
                       name={props.name}
                       nameMax={props.nameMax}
                       comment={props.comment}
                       isMarked={props.isMarked}
                       url={props.url}
                       compact={swCompact}
        // @ts-ignore
                       isNewAdded={detail.isNewAdded}
                       platIcon={props.platIcon}
        // @ts-ignore
                       swChecked={detail.basic.enable !== false}
                       onDel={async () => {
                         // 删除（撤销删除）
                         let data = await chrome.storage.sync.get({[key]: {}})
                         // 待移除项目的索引
                         let index = data[key].list.findIndex((item: B) =>
                           // @ts-ignore
                           item.plat === props.plat && item.id === props.id
                         )

                         // 待移除项目的详情信息的索引
                         let infoIndex = infosDetail.findIndex((item: D) =>
                           // @ts-ignore
                           item.basic.plat === props.plat && item.basic.id === props.id)

                         // 删除项目并提示是否撤销
                         delItemRevoke(`${props.name}(${props.plat} ${props.id})`, data[key].list, index,
                           (payload: Array<B>) => {
                             data[key].list = payload
                             chrome.storage.sync.set({[key]: data[key]})
                           },
                           infosDetail, infoIndex,
                           (infos: Array<D>) => setInfosDetail(infos)
                         )
                       }}
                       onSwitch={async (checked) => {
                         console.log(`[${title}] "${props.name}"(${props.id})切换了检测状态：${checked}`)
                         // 切换检测开关
                         // @ts-ignore
                         detail.basic.enable = checked
                         setInfosDetail(old => [...old])

                         // 保存到 chromium storage
                         let data = await chrome.storage.sync.get({[key]: {}})
                         let index = data[key].list.findIndex((item: B) =>
                           // @ts-ignore
                           item.plat === props.plat && item.id === props.id
                         )
                         if (index < 0) {
                           message.warn(`保存"${props.name}"(${props.id})的检测状态时出错：没有找到索引`)
                           return
                         }

                         data[key].list[index].enable = checked ? undefined : false
                         chrome.storage.sync.set({[key]: data[key]})
                       }}
      />
    }
  )

  // 添加新项
  const onAddItem = async (value: string, sList: Array<string>) => {
    let nItem: B = parseNewItem(value.trim(), sList)
    // @ts-ignore
    if (nItem.id === "") {
      message.info("信息不完整，无法添加")
      return
    }

    let data = await chrome.storage.sync.get({[key]: {}})
    // 当扩展刚安装而没有数据时，需要添加"list"属性
    if (!data[key].list) {
      data[key].list = []
    }
    // 是否已存在该项
    // @ts-ignore
    if (data[key].list.find((b: B) => nItem.id === b.id && nItem.plat === b.plat && nItem?.area === b?.area)) {
      message.info("该项已存在，不需重复添加")
      return
    }

    // 保存到存储
    data[key].list.push(nItem)
    chrome.storage.sync.set({[key]: data[key]})
    console.log(`${key} 已添加项目`, JSON.stringify(nItem))
    message.success("已添加新项目")

    // 获取信息详情以显示
    // @ts-ignore
    const status = await statusUtils[nItem.plat].check(nItem)
    // @ts-ignore
    console.log(`[${title}] 读取(${nItem.plat} ${nItem.id})的状态：`, JSON.stringify(status))
    // @ts-ignore
    let detail: D = {basic: nItem, status: status, isNewAdded: true}
    setInfosDetail(oldArray => insertOrdered(oldArray, detail, sortRule))
  }

  return (
    <VPanel title={title} slot={
      <span className="row">
        <Switch title="简洁模式" checked={swCompact} size="small" className="margin-right"
                onChange={async checked => {
                  setSwCompact(checked)
                  let data = await chrome.storage.sync.get({[key]: {}})
                  data[key].compactMode = checked
                  chrome.storage.sync.set({[key]: data[key]})
                }}/>
        <Switch title="准许通知" checked={swNo} size="small" className="margin-right"
                onChange={async checked => {
                  setSwNo(checked)
                  let data = await chrome.storage.sync.get({[key]: {}})
                  data[key].enable_notify = checked
                  chrome.storage.sync.set({[key]: data[key]})
                }}/>
        <Switch title="准许检测" checked={swEnable} size="small"
                onChange={async checked => {
                  setSwEnable(checked)
                  let data = await chrome.storage.sync.get({[key]: {}})
                  data[key].enable = checked
                  chrome.storage.sync.set({[key]: data[key]})
                }}/>
      </span>
    } style={{width: width}} content={
      <ul className="col">
        {listItems}
      </ul>
    } footer={
      <OptionInput placeholder={input.tip} enterButton="添加" size="small"
                   optionsList={input.options}
                   onSearch={(v, sList) => onAddItem(v, sList)}
      />}
    />
  )
}

export default ListAddComp