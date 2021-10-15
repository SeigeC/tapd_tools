import {writeFileSync, readFileSync} from "fs";
import Yaml from "yaml";
import node_fetch from "node-fetch";


const str = readFileSync('.config.yaml').toString()
export const {config, pr} = Yaml.parse(str)

export function rewriteConfig() {
  const str = Yaml.stringify({
    config,
    pr
  })
  writeFileSync('./.config.yaml', str)
}


export const fetch = async (url, params) => {
  const res = await node_fetch(url, {
    method: params ? "post" : "get",
    body: params ? JSON.stringify({
      ...params,
      workspace_id: config.workspace
    }) : undefined,
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${config.auth}:${config.key}`, 'binary').toString('base64')
    }
  })
  const json = await res.json()
  return json.data
}

export const bug_url = (params) => {
  return `${config.base_url}/bugs?workspace_id=${config.workspace}` + (params ? `&${encodeURI(params)}` : "")
}

export const bug_open_url = (bug_id) => {
  return `${config.view_url}/${config.workspace}/bugtrace/bugs/view?bug_id=${bug_id}`
}

export const story_url = (params) => {
  return `${config.base_url}/stories?workspace_id=${config.workspace}` + (params ? `&${encodeURI(params)}` : "")
}
export const story_open_url = (story) => {
  return `${config.view_url}/${config.workspace}/prong/stories/view/${story}`
}


export function wait(ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}
