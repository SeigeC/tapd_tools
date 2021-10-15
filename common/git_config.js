import ini from 'ini'
import {readFileSync} from "fs";

export const load_git_config = ()=>{
  const str = readFileSync('/Users/chengyuhan/go/src/github.com/MiaoSiLa/live-service/.git/config').toString()
  const obj = ini.parse(str)
  const pr = []
  for (const k in obj) {
    const reg = /^branch "(.+)"$/
    const res = k.match(reg);
    if(res?.length>=1){
      pr.push(res[1])
    }
  }
  return pr
}


