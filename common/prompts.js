import prompts from "prompts";
import {cyan, red} from "nanocolors";

export default async (...params) => {
  const res = await prompts(...params)
  process.stdout.write('\r\n')
  return res
}
