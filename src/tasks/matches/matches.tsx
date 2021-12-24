import {VPanel} from "../../components/vpanel"
import {useEffect, useRef, useState} from "react"
import {day, scrollIntoView} from "do-utils/dist/utils"
import {Avatar, message, Space} from "antd"
import {Element} from "cheerio"
import "./matches.css"
import {request} from "do-utils"
import Icon from '@ant-design/icons'
import {ReactComponent as IconHuya} from "../../icons/huya.svg"
import {ReactComponent as IconDouyu} from "../../icons/douyu.svg"
import {ReactComponent as IconBili} from "../../icons/bili.svg"
import {ReactComponent as IconDYS} from "../../icons/bili.svg"
import {ReactComponent as IconLck} from "../../icons/lck.svg"
import {ReactComponent as IconToCur} from "../../icons/to_current.svg"

const cheerio = require('cheerio')

// 当日的比赛整体为一个列表项，里面的比赛场次又构成一个列表
const ListItem = (props: {
  date: string,
  dateBlock: string,
  matches: Array<Game>,
  isMarked: boolean
}): JSX.Element => {
  // 一场比赛的布局
  const subItems = props.matches.map(game => (
    <li className={`row align-center padding ${game.live ? 'matches-live' : ''}`} key={game.starttime}>
      <span className="matches-time">{game.starttime}</span>

      <span className="col margin-left-large">
        <span className="row align-center">
          <Avatar src={game.oneicon} size={16}/>
          <span title={game.oneseedname} className={"team-name margin-left overflow-hide-line-one " +
            (game.isover && game.onewin < game.twowin ? 'game-lost' : '')}>
            {game.oneseedname}
          </span>
        </span>
        <span className="row align-center">
          <Avatar src={game.twoicon} size={16}/>
          <span title={game.twoseedname} className={"team-name margin-left overflow-hide-line-one " +
            (game.isover && game.onewin > game.twowin ? 'game-lost' : '')}>
            {game.twoseedname}
          </span>
        </span>
      </span>

      <span className="row game-score margin-left-large">
      {
        game.onewin !== '0' || game.twowin !== '0' ? (
          <span className="col align-center">
          <span className="row align-center">
            <span className="score-num">{game.onewin}</span>
            <span className="row margin-left-large">
              {
                game.oneScore.map((n) =>
                  <span className={`score-icon ${n === 1 ? 'score-icon-win' : ''}`}/>)
              }
            </span>
          </span>
          <span className="row align-center">
            <span className="score-num">{game.twowin}</span>
            <span className="row margin-left-large">
              {
                game.twoScore.map((n) =>
                  <span className={`score-icon ${n === 1 ? 'score-icon-win' : ''}`}/>)
              }
            </span>
          </span>
        </span>
        ) : (
          <span>BO{game.bonum}</span>
        )
      }
      </span>

      <span className="game-ename margin-left-large overflow-hide-line-one" title={game.ename}>
        {game.ename}
      </span>
    </li>
  ))

  // 一日内的所有比赛列表
  return (
    <li className={`col ${props.isMarked ? 'matches-recent' : ''}`}>
      <span className="matches-date padding">{props.dateBlock}</span>
      <ul className="col">
        {subItems}
      </ul>
    </li>
  )
}

export interface Matches {
  ret: number
  code: number
  msg: string
  data: {
    // 比赛日期、数据的键值对："{20211115:{}}"
    scheduleList: { [key: string]: ScheduleList };
    isShowList: number;
    // 1636819200
    prevtime: number;
    // 1636819200
    nexttime: number;
    // "上周 11.08-11.14"
    prevdate: string;
    // "下周 11.22-11.29"
    nextdate: string;
  }
}

// 某日的比赛数据
export interface ScheduleList {
  // 日期，如"20211115"。此属性为自定义添加的属性，用于判断最近一日的比赛以变色
  dateKey: string
  // 当日的开始的时间戳：1636905600
  time: number
  // "11-15"
  date: string
  // "周一"
  week: string
  // 当日游戏场数的列表，为false表示没有比赛
  list: Game[]
  // "11-15 星期一"
  lDate: string
  // "2021-11-15"
  filterdate: Date
  selected: boolean
}

// 某场比赛的数据
export interface Game {
  // "V5"
  oneseedname: string
  // "IG"
  twoseedname: string
  // "14:00"
  starttime: string
  // "0"
  onewin: string
  // "0"
  twowin: string
  // 局数：1、3、5
  bonum: number
  // 主队图标 "https://static.wanplus.com/data/lol/team/6643_mid.png"
  oneicon: string
  // 客队图标
  twoicon: string
  // 是否已结束
  isover: boolean
  // 是否正在比赛中
  live: boolean
  // 观赛地址
  liveList: Array<{
    // "1568743"
    id: string
    // "虎牙"
    name: string
  }>
  // 比赛的日期："20211115"
  relation: string
  // "11月15日 周一"
  date: string
  // 海报：https://static.wanplus.com/data/event/banner/1069_mid.jpg
  poster: string
  // 比赛名："2021NEST全国电子竞技大赛"
  ename: string
  // 组名："小组赛"
  groupname: string
  // 主队得分，-1：还没有结果；0：输；1：赢
  oneScore: number[]
  // 客队得分
  twoScore: number[]
}

// 比赛列表组件
// 当最近一周没有赛程时，继续请求以前日期的赛程
const MatchesComp = function (): JSX.Element {
  // 指定时间(如"1629648000"），将获取所在周的赛程
  const [time, setTime] = useState(Math.floor(Date.now() / 1000))
  // 赛程信息，更新界面
  const [matches, setMatches] = useState<Array<ScheduleList>>([])

  let loadBusyRef = useRef(false)
  // 最近的下一场比赛的日期，将标识
  let recentNextRef = useRef("")
  // 上一周赛程的开始日期（如 1628956800）
  let prevRef = useRef(0)
  // 下一周赛程的开始日期（如 1629648000）
  let nextRef = useRef(0)

  // 设置当日的日期（如"20210125"）
  let today = day()
  // 需要获取赛程的比赛
  const REG_EIDS = /(全球总决赛)|(LPL)|(LCK)|(NEST)/

  useEffect(() => {
    document.title = `比赛赛程 - ${chrome.runtime.getManifest().name}`

    loadBusyRef.current = true
    // 因为 scroll 事件会频繁触发，所以设置 setTimeout 避免多次获取赛程
    // 另外只使用 loadBusy 状态量时，如果网速过快--，起不了避免多次赛程的作用，所以另加 setTimeout 使用
    let setLoadDone = () => {
      setTimeout(() => {
        loadBusyRef.current = false
      }, 500)
    }

    // 临时此次获取的赛程，将合并到 matches
    let matchesTmp: Array<ScheduleList> = []
    const init = async () => {
      // 先获取赛区列表
      let listResp = await request("https://wanplus.com/lol/schedule")
      let listHtmlStr = await listResp.text()
      let $ = cheerio.load(listHtmlStr)

      // 需要获取赛程的赛区列表
      let eids: Array<string> = []
      let eidsName: Array<string> = []
      $("ul.slide-list li").toArray().forEach((item: Element) => {
        let doc = $(item)
        // 仅提取英雄联盟(编号为"2")的赛程
        if (doc.attr("data-gametype") === "2" && REG_EIDS.test(doc.text())) {
          eids.push(doc.attr("data-eid").trim())
          eidsName.push(doc.text().trim())
        }
      })

      // 再请求指定赛区的赛程
      let url = "https://m.wanplus.com/ajax/schedule/list"
      let data = `game=2&eids=${eids.join(",")}&time=${time}`
      let headers = {
        "x-requested-with": "XMLHttpRequest"
      }
      console.log(`获取LOL赛程(${time})`, `包含的赛区：${JSON.stringify(eidsName)}`)
      request(url, data, {headers: headers}).then(async resp => {
        let payload: Matches = await resp.json()

        // 提取赛程
        // 按日提取赛程信息
        for (const [date, matches] of Object.entries(payload.data.scheduleList)) {
          // list 为 false，表示当日没有比赛
          if (!matches.list) continue
          // 找到最近的下一场比赛的日期（如"20210125"）
          // 如果recentNext不为空，说明已找到离今天最近的赛程，不需要再改变了
          if (recentNextRef.current === "" && date >= today) {
            recentNextRef.current = date
          }

          // 添加当日的比赛到列表
          matchesTmp.push(matches)
        }

        // 根据获取更早、更晚赛事的情况，需要分先后连接数组
        if (time === nextRef.current) {
          setMatches(prev => [...prev, ...matchesTmp])
        } else if (time === prevRef.current) {
          setMatches(prev => [...matchesTmp, ...prev])
        } else {
          setMatches([...matchesTmp])
          // 首次获取赛程时，自动滚动到当天的赛程（因为渲染问题，需要延迟一会儿）
          scrollIntoView(".matches-recent")
        }

        setLoadDone()
        // 最近一周没有赛程时，继续请求以前日期的赛程
        if (matchesTmp.length === 0) {
          if (matches.length === 0) {
            setTime(payload.data.prevtime)
            return
          } else {
            message.info("没有更多的赛程信息了")
            return
          }
        }
        // 保存更前、后赛程的时间信息
        if (nextRef.current === 0 || payload.data.nexttime > nextRef.current) {
          nextRef.current = payload.data.nexttime
        }
        if (prevRef.current === 0 || payload.data.prevtime < prevRef.current) {
          prevRef.current = payload.data.prevtime
        }
      }, error => {
        console.log(`获取 LOL 赛程时出现网络错误`, error)
        setLoadDone()
      })
    }

    // 请求数据、更新界面
    init()
  }, [time])

  // 使用滚轮事件加载更多
  let elem = document.querySelector(".VPanel-content")
  if (elem) {
    elem.addEventListener("mousewheel", event => {
      if (loadBusyRef.current) {
        return
      }
      // @ts-ignore
      if (event.deltaY > 0 && elem.scrollTop >= elem.scrollHeight - elem.offsetHeight - 200) {
        setTime(nextRef.current)
      }

      // @ts-ignore
      if (event.deltaY < 0 && elem.scrollTop <= 200) {
        setTime(prevRef.current)
      }
    })
  }

  // 工具栏
  let tools = (
    <Space className="padding-h">
      <Icon className="clickable" title="LPL 虎牙" alt="虎牙" component={IconHuya}
            onClick={_ => window.open('https://www.huya.com/lpl', '_blank')}/>
      <Icon className="clickable" title="LPL 斗鱼" alt="斗鱼" component={IconDouyu}
            onClick={_ => window.open('https://www.douyu.com/lpl', '_blank')}/>
      <Icon className="clickable" title="LPL 哔哩哔哩" alt="哔哩" component={IconBili}
            onClick={_ => window.open('https://live.bilibili.com/6', '_blank')}/>
      <Icon className="clickable" title="LPL 德云色" alt="德云色" component={IconDYS}
            onClick={_ => window.open('https://live.bilibili.com/7777', '_blank')}/>
      <Icon className="clickable" title="LCK" alt="LCK" component={IconLck}
            onClick={_ => window.open('https://www.huya.com/lck', '_blank')}/>
      <Icon className="clickable" title="跳转到今天的赛程" alt="跳转" component={IconToCur}
            onClick={_ => scrollIntoView('.matches-recent')}/>
    </Space>
  )

  // 渲染赛程
  let matchesList = matches.map(schedule =>
    <ListItem key={schedule.date}
              date={schedule.dateKey}
              dateBlock={schedule.lDate}
              matches={schedule.list}
              isMarked={schedule.dateKey === recentNextRef.current}
    />
  )

  return (
    <VPanel title={"LOL 赛程"} content={<ul>{matchesList}</ul>} slot={tools} style={{width: 450}}/>
  )
}

export default MatchesComp