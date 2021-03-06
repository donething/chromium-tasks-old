import React from 'react'
import ReactDOM from 'react-dom'
import {HashRouter as Router, Route} from 'react-router-dom'
import reportWebVitals from './reportWebVitals'
import OptionsComp from './pages/options/OptionsComp'
import PopupComp from './pages/popup/PopupComp'
import AttentionComp from "./tasks/attention/attentions"
import MatchesComp from "./tasks/matches/matches"
import TasksComp from "./tasks/tasks"
import PicTaskComp from "./tasks/pics/pic_task_comp"
import {ZujiComp} from "./tasks/zuji/zuji"
import './index.css'

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Route path="/options" component={OptionsComp}/>
      <Route path="/popup" component={PopupComp}/>
      <Route path="/attentions" component={AttentionComp}/>
      <Route path="/matches" component={MatchesComp}/>
      <Route path="/tasks" component={TasksComp}/>
      <Route path="/pics" component={PicTaskComp}/>
      <Route path="/zuji" component={ZujiComp}/>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
