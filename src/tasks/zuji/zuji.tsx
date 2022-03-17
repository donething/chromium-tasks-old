import {RoomStatus} from "./types"
import {Button, Empty, Input, message, Modal, Spin} from "antd"
import {
  CopyOutlined,
  FontSizeOutlined,
  HomeOutlined,
  PlayCircleOutlined,
  UserOutlined
} from "@ant-design/icons"
import {useEffect, useState} from "react"
import {getRoomsStatus} from "./task"
import {useBetween} from "use-between"

// localstorage 中保存用户 ssid 的键
const LS_SSID = "ct_ssid"

// 设置的属性
const useZJSettings = () => {
  const [ssid, setSsid] = useState("")
  const [isSVisible, setIsSVisible] = useState(false)

  return {
    ssid, setSsid, isSVisible, setIsSVisible
  }
}

// 网页头
const Header = (props: { count: number }) => {
  const {setIsSVisible} = useBetween(useZJSettings)

  return (
    <div className="row justify-between padding-bottom border-bottom">
      <span className="post-description">有 {props.count} 个关注的主播在线</span>
      <span>
        <Button size="small" onClick={_ => setIsSVisible(true)}>输入 SSID</Button>
      </span>
    </div>
  )
}

// 设置面板
const ZJSettings = () => {
  const {ssid, setSsid, isSVisible, setIsSVisible} = useBetween(useZJSettings)

  useEffect(() => {
    setSsid(localStorage.getItem(LS_SSID) || "")
  }, [])

  return (
    <Modal title="设置" visible={isSVisible} okText="保存" onOk={_ => {
      if (!ssid) {
        message.warn("用户的 sessionid 为空")
        return
      }
      localStorage.setItem(LS_SSID, ssid)
      setIsSVisible(false)
      window.location.reload()
    }} cancelText="取消" onCancel={_ => setIsSVisible(false)}>
      <Input placeholder="用户的 sessionid" value={ssid} onChange={e => setSsid(e.target.value)}/>
    </Modal>
  )
}

// 单个项目
const AnchorItem = (props: { room: RoomStatus }) => {
  return (
    <div className="col border hoverable" style={{width: 230, background: "#FFF"}}>
      <div className="row gap align-center padding-h-large padding-top-large overflow-hide-line-one">
        <img className="avatar-medium" alt={props.room.nickname} src={props.room.logourl}/>
        <span>{props.room.nickname}</span>
        <span className="post-extra overflow-hide-line-one" title="主播 ID，点击复制" onClick={_ => {
          navigator.clipboard.writeText(props.room.name)
          message.success("已复制 主播的 ID")
        }}>{props.room.name}</span>
      </div>

      <div className="col padding-h-large">
        <span className="posts-content margin-bottom overflow-hide-line-one" title={props.room.title}>
          {props.room.title}
        </span>

        <div className="col post-description">
          <span title="正在观看的人数 / 总观看的人数">
            <UserOutlined className="margin-right"/>
            {props.room.watching_count} / {props.room.watch_count}</span>
          <span title="开播时间">
            <PlayCircleOutlined className="margin-right"/>
            {props.room.live_start_time}</span>
        </div>
      </div>

      <div className="row wrap justify-between width-100per border-top">
        <PlayCircleOutlined className="clickable padding-large" title="外部播放" onClick={_ => {
          window.open(`potplayer://${props.room.play_url}`)
        }}/>

        <CopyOutlined className="clickable padding-large" title="复制直播地址" onClick={_ => {
          navigator.clipboard.writeText(props.room.play_url)
          message.success("已复制 主播的直播地址")
        }}/>

        <FontSizeOutlined className="clickable padding-large" title="网页播放，可查看评论" onClick={_ => {
          window.open(props.room.share_url)
        }}/>

        <HomeOutlined className="clickable padding-large"
                      title={`复制所在经纬度(${props.room.gps_longitude},${props.room.gps_latitude})`} onClick={_ => {
          navigator.clipboard.writeText(`${props.room.gps_longitude},${props.room.gps_latitude}`)
          message.success("已复制 主播所在位置的经纬度")
        }}/>
      </div>
    </div>
  )
}

// 面板
export const ZujiComp = () => {
  const [rooms, setRooms] = useState<Array<RoomStatus>>()

  useEffect(() => {
    document.title = `足迹直播 - ${chrome.runtime.getManifest().name}`

    let ssid = localStorage.getItem(LS_SSID)
    if (!ssid) {
      message.warn("用户的 SSID 为空，请先设置")
      return
    }
    getRoomsStatus(ssid, (rs, err) => {
      if (err) {
        Modal.error({title: "获取主播列表出错", content: err, okText: "确定"})
        return
      }
      setRooms(prev => [...prev || [], ...rs])
    })
  }, [])

  return (
    <div className="col gap-l padding-h-large padding-v">
      <Header count={rooms?.length || 0}/>

      <div className="row wrap gap-l">
        {
          !rooms ? <Spin size="large"/> : rooms.length === 0 ?
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有关注的主播在线"/> :
            rooms.map(room => <AnchorItem key={room.name} room={room}/>)
        }
      </div>

      <ZJSettings/>
    </div>
  )
}
