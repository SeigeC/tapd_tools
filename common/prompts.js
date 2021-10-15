import prompts from "prompts";
import {wait} from './config.js'

export default async (...params) => {
  await wait(300)
  const res = await prompts(...params)
  process.stdout.write('\r')
  return res
}
