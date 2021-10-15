import newTask from "./common/tasuku/dist/index.js";
import {loading_bug, loading_story, new_branch, get_branch} from "./func/branch.js";
import {$, nothrow, argv} from 'zx'
import {log} from "./common/log.js";
import {pr} from "./common/config.js";
import {red} from "nanocolors";

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
    const {stderr} = await nothrow(await new_branch(tapd_list))
    log(stderr);
  },
  'push': async () => {
    let {stdout: branch} = await $`git symbolic-ref --short HEAD`
    branch = branch.substr(0, branch.length - 1)
    for (const key in pr) {
      const item = pr[key]
      if (item.branch !== branch) {
        continue
      }
      const tapd = tapd_list.find(tapd => {
        return tapd.id === item.id
      })
      if (!tapd) {
        log(red('无法找到 tapd'))
        return
      }
      const res = await $`gh pr create --title ${tapd.title} --body ${'tapd: ' + tapd.url}`
      return log(res.stderr)
    }
    log(red('无法通过当前分支找到 tapd 链接'))
  },
  'checkout': get_branch
}
if (argv._.length <= 0) {
  process.exit()
}

const func = argfunc[argv._[0]]
func?.()



