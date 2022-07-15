import prompts from "../common/prompts.js";
import {bug_open_url, bug_url, config, fetch, pr, rewriteConfig, story_open_url, story_url} from "../common/config.js";
import {load_git_config} from "../common/git_config.js";
import {cyan, red} from "nanocolors";
import {$} from 'zx'
import {log} from "../common/log.js";

export const get_branch = async () => {
  // git checkout
  const {branch} = (await prompts({
    type: 'select',
    name: 'branch',
    message: '请选择要切换的分支',
    choices: Object.keys(pr).map(key => {
      const item = pr[key]
      return {
        title: key,
        value: item.branch
      }
    }),
    initial: 0
  }))
  if (!check_branch(branch)) {
    process.stdout.write(red("分支不存在"))
    process.exit()
  }
  return $`git checkout ${branch}`
}

export const check_branch = (branch) => {
  const gitConfig = load_git_config();
  return gitConfig.includes(branch)
}


export const new_branch = async (tapd_list) => {
  // git checkout -b
  const {tapd} = (await prompts({
    type: 'select',
    name: 'tapd',
    message: '请选择创建的需求',
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
  }))
  const branch = `${tapd.tag}_${tapd.id}`
  if (check_branch(branch)) {
    log(red("分支已经存在"))
    process.exit()
  }
  pr[tapd.title] = {
    tag: tapd.tag,
    id: tapd.id,
    branch: branch
  }

  // const res = await update_story(tapd.id, {status: 'developing'})
  // if (res.Story.status !== 'developing') {
  //   log(red("tapd 状态变更失败"))
  //   process.exit()
  // }
  rewriteConfig()
  return $`git checkout -b ${branch}`
}

export const loading_bug = async () => {
  const not = ['verified', 'suspended']
  const status = Object.keys(config.bug.status).filter(key => !not.includes(key))
  const url = bug_url(`limit=200&de=${config.name}&status=${status.join('|')}`)
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


export const loading_story = async () => {
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

export const update_story = async (id, params) => {
  const url = story_url()
  return await fetch(url, {
    id,
    ...params
  })
}
