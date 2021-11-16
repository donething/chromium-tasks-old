import {Card} from "antd"
import {useEffect, useState} from "react"

const TasksComp = () => {
  const [ccmnn, setCcmnn] = useState<{ [last: string]: string }>({})
  const [hdsay, setHdsay] = useState<{ [last: string]: string }>({})

  useEffect(() => {
    const init = async () => {
      setCcmnn((await chrome.storage.sync.get("ccmnn")).ccmnn)
      setHdsay((await chrome.storage.sync.get("hdsay")).hdsay)
    }

    init()
  }, [])

  return (
    <Card title="任务记录" size="small" style={{width: "300px"}}>
      <div><a href="https://club.ccmnn.com/" target="_blank">Ccmnn</a>：<span>{ccmnn.last}</span></div>
      <div><a href="https://www.hdsay.net/" target="_blank">Hdsay</a>：<span>{hdsay.last}</span></div>
    </Card>
  )
}

export default TasksComp