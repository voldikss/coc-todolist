import { TodoItem } from '../types'
import { workspace } from 'coc.nvim'

// TODO: rename
export function JSON2YAML(todo: TodoItem): string[] {
  const yaml: string[] = []

  const tmp = Object.keys(todo).map(key => key + todo[key])
  workspace.showMessage(JSON.stringify(tmp))

  return yaml
}
