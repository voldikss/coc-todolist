
import { join } from 'path'
import { readdirSync, existsSync } from 'fs'
import {
  IList,
  ListAction,
  ListContext,
  ListItem,
  workspace,
  Uri,
} from 'coc.nvim'

export default class TodoList implements IList {
  public readonly name = 'todo'
  public readonly description = 'todo files'
  public readonly defaultAction = 'open'
  public actions: ListAction[] = []

  constructor(private rootPath: string) {
    this.actions.push({
      name: 'open',
      execute: async item => {
        if (Array.isArray(item)) {
          return
        }
        workspace.openResource(Uri.file(join(this.rootPath, item.label)).toString())
      }
    })
  }

  public async loadItems(_context: ListContext): Promise<ListItem[]> {
    const list = []
    if (existsSync(this.rootPath)) {
      const dirs = readdirSync(this.rootPath)
      if (dirs) {
        return dirs.map<ListItem>(name => ({
          label: name,
          filterText: name
        }))
      }
    }
    return list
  }
}
