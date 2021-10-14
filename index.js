import Yaml from 'yaml'
import {readFileSync} from 'fs'
import newTask from "./tasuku/dist/index.js";
import prompts from './common/prompts.js'
import node_fetch from 'node-fetch'
import {cyan, red} from 'nanocolors'


const str = readFileSync('./.config.yaml').toString()
const {config} = Yaml.parse(str)

const bug_url = (params) => {
  return `${config.base_url}/bugs?workspace_id=${config.workspace}` + (params ? `&${encodeURI(params)}` : "")
}

const fetch = async (url) => {
  const res = await node_fetch(url, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${config.auth}:${config.key}`, 'binary').toString('base64')
    }
  })
  return (await res.json()).data
}

const bug_open_url = (bug_id) => `${config.view_url}/${config.workspace}/bugtrace/bugs/view?bug_id=${bug_id}`
const loading_bug = async () => {
  const not = ['verified', 'suspended']
  const status = Object.keys(config.bug.status).filter(key => !not.includes(key))
  const url = bug_url(`limit=200&current_owner=${config.name}&status=${status.join('|')}`)
  const res = await fetch(url)
  return res.map(item => {
    const bug = item.Bug
    return {
      'id': bug['id'],
      'title': bug['title'],
      'url': bug_open_url(bug['id']),
      'tag': 'bug',
      'status': config.bug.status[bug['status']]
    }
  })
}


const story_url = (params) => {
  return `${config.base_url}/stories?workspace_id=${config.workspace}` + (params ? `&${encodeURI(params)}` : "")
}
const story_open_url = (story) => `${config.view_url}/${config.workspace}/prong/stories/view/${story}`
const loading_story = async () => {
  const status = Object.keys({
    "planning": "规划中",
    "auditing": "评审中",
    "status_10": "待排期",
    "status_4": "待开发",
    "developing": "开发中",
    "status_12": "技术验收",
    "product_experience": "产品验收",
    "for_test": "验收通过待测试",
    "testing": "测试中",
    "status_2": "测试通过待合入",
    "status_7": "免测待合入",
  })
  const url = story_url(`limit=200&developer=${config.name};&status=${status.join('|')}`)
  const res = await fetch(url)
  return res.map(item => {
    const story = item.Story
    return {
      'id': story['id'],
      'title': story['name'],
      'url': story_open_url(story['id']),
      'tag': 'story',
      'status': config.story.status[story['status']]
    }
  })
}
let task = newTask()
const {result: tapd_list} = await task("loading", async ({task}) => {
  const list = []
  const api = await task.group(t => [
    t('查询Bug', async () => {
      list.push(...await loading_bug())
    }),
    t('查询需求', async () => {
      list.push(...await loading_story())
    })
  ])
  await api.clear()
  return list
})

function wait(ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

await wait(300)


const project = (await prompts({
  type: 'select',
  name: 'value',
  message: '请选择要拉取的项目',
  choices: tapd_list.map(item => {
    const tag = {
      "bug": red('[bug]'),
      "story": cyan('[story]'),
    }
    return {
      title: `${tag[item.tag] ? tag[item.tag] + " " : ""}${item.title} ${item.status}`,
      value: item
    }
  }),
  initial: 0
})).value

