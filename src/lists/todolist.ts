import { join } from 'path'
import { readdirSync, existsSync } from 'fs'
import {
  ListAction,
  ListContext,
  ListItem,
  workspace,
  Uri,
  BasicList,
  Neovim,
} from 'coc.nvim'
import DB from '../util/db'

export default class TodoList extends BasicList {
  public readonly name = 'todo'
  public readonly description = 'todo files'
  public readonly defaultAction = 'open'
  public actions: ListAction[] = []

  constructor(
    protected nvim: Neovim,
    private rootPath: string,
    private db: DB
  ) {
    super(nvim)

    this.actions.push({
      name: 'open',
      execute: async (item: ListItem) => {
        if (Array.isArray(item)) {
          return
        }
        workspace.openResource(
          Uri.file(join(this.rootPath, item.label)).toString()
        )
      }
    })

    this.actions.push({
      name: 'delete',
      execute: async (item: ListItem) => {
        const { id } = item.data
        this.db.delete(id)
      }
    })

    this.actions.push({
      name: 'preview',
      execute: async (item: ListItem) => {
        //
      }
    })
  }

  public async loadItems(_context: ListContext): Promise<ListItem[]> {
    let arr = await this.db.load()
    let columns = await this.nvim.getOption('columns') as number
    let res: ListItem[] = []
    for (let item of arr) {
      let abbr = item.content.title
      // TODO
      // let text = item.content[0].padEnd(20) + item.content[1]
      // let abbr = text.length > columns - 20 ? text.slice(0, columns - 15) + '...' : text
      res.push({
        label: abbr,
        filterText: abbr,
        data: Object.assign({}, item)
      })
    }
    return res
  }
}
