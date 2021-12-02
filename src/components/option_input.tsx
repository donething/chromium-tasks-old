import {Input, Select} from "antd"
import {SizeType} from "antd/es/config-provider/SizeContext"
import React, {ReactNode, useState} from "react"
// antd Input 搜索按钮
const {Search} = Input
// antd Select 的选项
const {Option} = Select

// 选项
export type OptionItem = { title: string, value: string, tip?: string }

// 含前置选择框的输入框的选项
type OptionInputProps = {
  // 选择框 Option 的数组，选项值、选项标题、描述，每一个对象都是一个选择框
  // 如：[{ bili: {title: "哔哩", tip: "主播的UID，不是房间号"} ]
  // 推荐选项标题最长的放到该对象的最末（将设为默认值，避免宽度和其它选项不一致的问题）
  optionsList: Array<Array<OptionItem>>

  // 输入提示文本
  placeholder: string
  // 尺寸
  size?: SizeType
  // 是否添加确认按钮，可为 ReactNode、文字，与"addonAfter"属性冲突
  enterButton?: boolean | ReactNode | string,
  // 点击确认按钮后的回调函数，参数依次为：输入框的值、选择框中被选择的值（为了兼容多选的情况，传递数组）、事件对象
  onSearch: (value: string, sList: Array<string>, event?: React.ChangeEvent<HTMLInputElement>
    | React.MouseEvent<HTMLElement>
    | React.KeyboardEvent<HTMLInputElement>) => void
}
// 含前置选择框的输入框
export const OptionInput = function (props: OptionInputProps): JSX.Element {
  // 前置选择框被选择的值，该值将被在事件中传递到父组件
  const [slist, setSlist] = useState<Array<string>>([])
  // 输入框的值，用于按下确认按钮后，清除搜索框的值
  const [value, setValue] = useState("")

  // 生成所有的选择框
  let selectsList: Array<JSX.Element> = []
  // 避免setXXX()异步执行导致默认选项多次设置的问题，设置该标志变量
  const hadSet: Array<boolean> = []
  props.optionsList.forEach((el, index) => {
    // 当前选择框的选项
    let options = []
    // 提取该选择框的选项
    for (const option of el) {
      // 将选项列表的第一项设为默认选中
      if (!slist[index] && !hadSet[index]) {
        // 标志已设了默认值
        hadSet[index] = true
        setSlist(prev => {
          let newList = [...prev]
          newList[index] = option.value
          return newList
        })
      }
      options.push(<Option value={option.value} title={option.tip}>{option.title}</Option>)
    }
    // 将该选择框添加到列表中
    selectsList.push((
      <Select size="small" value={slist[index]}
              onChange={selected => setSlist(prev => {
                let newList = [...prev]
                newList[index] = selected
                return newList
              })}>
        {options}
      </Select>
    ))
  })

  return (
    <div className="row">
      {selectsList}
      <Search
        value={value}
        onChange={v => setValue(v.target.value)}
        placeholder={props.placeholder}
        enterButton={props.enterButton}
        size={props.size}
        onSearch={(value, e) => {
          props.onSearch(value, slist, e)
          setValue("")
        }}
      />
    </div>
  )
}