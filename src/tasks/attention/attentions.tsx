// 关注组件
import ListAddComp from "../../components/list_add_comp"
import {anchor} from "./libs/anchors"
import {app} from "./libs/apps"
import {useEffect} from "react"

const AttentionComp = () => {
  useEffect(() => {
    document.title = `关注的 - ${chrome.runtime.getManifest().name}`
  }, [])

  let anchors = ListAddComp("关注的主播", "anchors", 350,
    anchor.StatusUtils, (detail: anchor.Detail) => {
      return {
        id: detail.basic.id,
        plat: detail.basic.plat,
        // @ts-ignore
        platIcon: anchor.StatusUtils[detail.basic.plat].favicon,
        icon: detail.status.avatar,
        name: detail.status.name,
        title: detail.status.title,
        nameMax: 200,
        comment: "",
        isMarked: detail.status.online === 1,
        url: detail.status.liveUrl,
      }
    }, {
      tip: "主播ID/房间ID",
      options: [[
        {title: "虎牙", value: "huya", tip: "房间号"},
        {title: "斗鱼", value: "douyu", tip: "房间号"},
        {title: "哔哩", value: "bili", tip: "主播的UID，不是房间号"},
        {title: "抖音", value: "douyin", tip: "直播间号(如'6959169539363949319')，不是抖音号、ID"}
      ]],
    }, (value, slist) => {
      return new anchor.Basic({id: value, plat: slist[0]})
    }, [anchor.Sorts.online, anchor.Sorts.plat, anchor.Sorts.name]
  )

  let apps = ListAddComp("关注的应用", "apps", 350,
    app.StatusUtils, (detail: app.Detail) => {
      return {
        id: detail.basic.id,
        plat: detail.basic.plat,
        // @ts-ignore
        platIcon: app.StatusUtils[detail.basic.plat].favicon,
        icon: detail.status.icon,
        name: detail.status.name,
        title: detail.status.description,
        nameMax: 200,
        comment: detail.status.formattedPrice,
        isMarked: detail.status.price === 0,
        url: detail.status.viewURL,
      }
    }, {
      tip: "应用的 ID",
      options: [[
        {title: "AppStore", value: "appstore", tip: "数字ID前不需要'id'"},
        {title: "PlayStore", value: "playstore", tip: "APP 的包名"}
      ], [
        {title: "CN", value: "cn"},
        {title: "US", value: "us"}
      ]],
    }, (value, slist) => {
      return new app.Basic({id: value, plat: slist[0], area: slist[1]})
    }, []
  )

  return (
    <div className="row wrap margin-sub-right-large">
      {anchors}
      {apps}
    </div>
  )
}

export default AttentionComp