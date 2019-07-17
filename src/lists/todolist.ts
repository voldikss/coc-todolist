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
import { JSON2YAML } from '../util/util'

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
        const todo: TodoItem = item.data.content
        // const todoContent = Object.keys(todo).map(key => key + todo[key])
        nvim.pauseNotification()
        await workspace.nvim.command('tab new .todo')
        await nvim.command('set filetype=todo')
        await nvim.command('set syntax=yaml')
        nvim.command('set nobuflisted', true)
        nvim.command('set buftype=nowrite', true)
        nvim.call('append', ['0', JSON2YAML(todo)])
        nvim.command('normal gg', true)
        await nvim.resumeNotification()
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
      execute: async (item: ListItem, context) => {
        const todo: TodoItem = item.data.content
        await this.preview({
          bufname: 'todolist',
          sketch: true,
          filetype: 'yaml',
          lines: JSON2YAML(todo),
        }, context)
      }
    })
  }

  public async loadItems(_context: ListContext): Promise<ListItem[]> {
    let arr = await this.db.load()
    let columns = await this.nvim.getOption('columns') as number
    let res: ListItem[] = []
    for (let item of arr) {
      let title = item.content.Title
      let tags = item.content.Tags || []
      let status = item.content.Status
      res.push({
        label: `${title}: ${status} | ${tags.join('#')}`,
        filterText: title + status + tags.join(''),
        data: Object.assign({}, item)
      })
    }
    return res
  }
}
