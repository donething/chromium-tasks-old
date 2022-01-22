import {Button, Card, message} from "antd"
import {useEffect, useState} from "react"
import {CCmnn, CcmnnSets} from "./ccmnn"
import {HdsaySets} from "./hdsay"

// 任务执行的详情组件
const TasksComp = () => {
  const initV = {last: "未知", replyCount: 0, total: 0}
  const [tasks, setTasks] = useState<{ ccmnn: CcmnnSets, hdsay: HdsaySets }>({ccmnn: initV, hdsay: initV})

  const init = async () => {
    let data = await chrome.storage.sync.get("tasks")
    setTasks(data.tasks)
  }

  useEffect(() => {
    document.title = `任务记录 - ${chrome.runtime.getManifest().name}`

    init()
  }, [])

  return (
    <div className="row wrap">
      <Card title="Ccmnn" size="small" style={{width: 280}}
            extra={<div>
              <Button onClick={async () => {
                message.info("已重启 Ccmnn 任务，请打开 Devtools")
                chrome.alarms.clear(CCmnn.TAG_EN)
                // ccmnn
                await CCmnn.startTask()
                // 自动回复有奖励的帖子
                // 必须等上面的每日回帖任务完成后，才能开始回复奖励帖子的任务，以免因为网站回帖间隔限制（30秒）造成不必要的麻烦
                chrome.alarms.create(CCmnn.TAG_EN, {delayInMinutes: 1})
              }} target="_blank" size="small">重启任务
              </Button>
              <Button href="https://club.ccmnn.com/" target="_blank" size="small">访问</Button>
            </div>}>
        <div>
          <div>最近回帖日期：<span style={{fontWeight: "bold"}}>
            {tasks.ccmnn.last}{tasks.ccmnn.last === new Date().toLocaleDateString() ? " (今日)" : ""}</span>
          </div>
          <div>当日已回帖数：<span style={{fontWeight: "bold"}}>{tasks.ccmnn.replyCount}</span></div>
          <div>历史总回帖数：<span style={{fontWeight: "bold"}}>{tasks.ccmnn.total}</span></div>
        </div>
      </Card>

      <Card title="Hdsay" size="small" style={{width: 280}}
            extra={<Button href="https://www.hdsay.net/" target="_blank" size="small">访问</Button>}>
        <div>
          <div>最近回帖日期：<span style={{fontWeight: "bold"}}>
            {tasks.hdsay.last}{tasks.hdsay.last === new Date().toLocaleDateString() ? " (今日)" : ""}</span>
          </div>
          <div>当日已回帖数：<span style={{fontWeight: "bold"}}>{tasks.hdsay.replyCount}</span></div>
          <div>历史总回帖数：<span style={{fontWeight: "bold"}}>{tasks.hdsay.total}</span></div>
        </div>
      </Card>
    </div>
  )
}

export default TasksComp