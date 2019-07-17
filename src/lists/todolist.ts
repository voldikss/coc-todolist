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
import { TodoItem } from '../types'

export default class TodoList extends BasicList {
  public readonly name = 'todo'
  public readonly description = 'todo files'
  public readonly defaultAction = 'toggle'
  public actions: ListAction[] = []

  constructor(
    protected nvim: Neovim,
    private rootPath: string,
    private db: DB
  ) {
    super(nvim)

    this.actions.push({
      name: 'toggle',
      execute: async (item: ListItem) => {
        if (Array.isArray(item)) {
          return
        }
      }
    })

    this.actions.push({
      name: 'preview',
      execute: async (item: ListItem, context) => {
        // const todo: TodoItem = item.data.content
        // await this.preview({
        //   bufname: 'todolist',
        //   sketch: true,
        //   filetype: 'yaml',
        //   lines: JSON2YAML(todo),
        // }, context)
      }
    })

    this.actions.push({
      name: 'edit',
      execute: async (item: ListItem) => {
        //
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
      name: 'cancel',
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
      let content = item.content.content
      let status = item.content.status
      res.push({
        label: `${content}: ${status}`,
        filterText: content + status,
        data: Object.assign({}, item)
      })
    }
    return res
  }
}
