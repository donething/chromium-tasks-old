// 垂直布局的面板的参数
import React from "react"

type VPanelProps = {
  // 面板头的标题
  title: string
  // 面板头右边的操作区域
  slot?: JSX.Element
  // 主内容区
  content: JSX.Element,
  // 底部
  footer?: JSX.Element,
  // 样式
  style?: React.CSSProperties
}
// 垂直布局的面板的参数
export const VPanel = function (props: VPanelProps): JSX.Element {
  return (
    <div className="VPanel" style={props.style}>
      <div className="VPanel-header">
        <div className="VPanel-header-title">{props.title}</div>
        <div>{props.slot}</div>
      </div>
      <div className="VPanel-content">
        {props.content}
      </div>
      <div className="VPanel-footer">
        {props.footer}
      </div>
    </div>
  )
}