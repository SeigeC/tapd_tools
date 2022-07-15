import newTask from "./common/tasuku/src/index.js";
import {loading_bug, loading_story, new_branch, get_branch} from "./func/branch.js";
import {$, nothrow, argv, fetch} from 'zx'
import {log} from "./common/log.js";
import {pr} from "./common/config.js";

$.verbose = false;
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
  ], {
    concurrency: 2
  })
  await api.clear()
  return list
})

const argfunc = {
  'new': async () => {
    // @ts-ignore
    const {stderr} = await nothrow(await new_branch(tapd_list))
    log(stderr);
  },
  'push': async () => {
    const task = newTask()
    await task('push', async ({task, setError}) => {
      const {result: branch} = await task('获取分支', async ({setOutput}) => {
        let {stdout: branch} = await $`git symbolic-ref --short HEAD`
        branch = branch.substr(0, branch.length - 1)
        setOutput(`branch name: ${branch}`)
        return branch
      })
      const {result: tapd} = await task('获取 tapd', async ({setError, setOutput}) => {
          for (const key in pr) {
            const item = pr[key]
            if (item.branch !== branch) {
              continue
            }
            const tapd = tapd_list.find(tapd => {
              return tapd.id === item.id
            })
            if (!tapd) {
              setError('无法找到 tapd')
              return
            }
            setOutput(`tapd name ${key}`)
            return item
          }
          setError('无法通过当前分支找到 tapd 链接')
        }
      )
      const tapd_data = tapd_list.find(item => {
        return item.tag === tapd.tag && item.id === tapd.id
      })
      if (!tapd_data) {
        setError('无法通过当前分支找到 tapd 链接')
        return
      }
      await task('git push', async ({setOutput}) => {
        const {stdout} = await $`git push --set-upstream origin ${branch}`
        setOutput(stdout)
      })
      await task('创建 RP', async ({setOutput}) => {
        const res = await $`gh pr create --title ${tapd_data.title} --body ${`## TAPD\n${tapd_data.url}\n## 改动\n## 配置\n## SQL 或脚本\n## Grafana 面板`}`
        setOutput(res.stderr)
      })
    })
  },
  'checkout': get_branch,
  'ok': async function () {
    const task = newTask()
    await task('催 PR', async ({task}) => {
      const {result: pr} = await task('获取 pr 信息', async ({}) => {
        const {stdout} = await $`gh pr view --json url,title`
        return JSON.parse(stdout)
      })
      const {result: access_token} = await task('get qywx token', async () => {
        const res = await fetch("https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=wx0833ac9926284fa5&corpsecret=fszwjMpoopKuG_807fxCHifMW7WkOfIrKCyDXMcNlY8")
        // @ts-ignore
        const {access_token} = await res.json()
        return access_token
      })
      await task('推送消息', async () => {
        const res = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${access_token}`, {
          method: 'post',
          body: JSON.stringify({
            "touser": "013211",
            "toparty": "",
            "totag": "",
            "msgtype": "text",
            "agentid": 1000258,
            "text": {
              "content": `${pr.url} 看下这个 PR 吧 <a href="${pr.url}#target=out">${pr.title}</a> [修改会议信息](https://work.weixin.qq.com#target=out)`
            },
            "safe": 0
          }),
          headers: {'Content-Type': 'application/json'}
        })
        await res.json()
      })
    })
  }
}
if (argv._.length <= 0
) {
  process.exit()
}

const func = argfunc[argv._[0]]
func?.()



