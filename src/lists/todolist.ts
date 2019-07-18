import {
  ListAction,
  ListContext,
  ListItem,
  BasicList,
  Neovim,
  workspace,
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
    private db: DB
  ) {
    super(nvim)

    this.addAction('toggle', async (item: ListItem) => {
      const todo: TodoItem = item.data.content
      const { id } = item.data
      if (todo.status === 'active')
        todo.status = 'completed'
      else if (todo.status === 'completed')
        todo.status = 'cancelled'
      await this.db.update(id, todo)
    }, { persist: true, reload: true })

    this.addAction('preview', async (item: ListItem, context) => {
      const todo: TodoItem = item.data.content
      const lines = Object.keys(todo).map(key => `${key}: ${todo[key]}`)
      await this.preview({
        bufname: 'todolist',
        sketch: true,
        filetype: 'yaml',
        lines,
      }, context)
    }, { persist: true, reload: true })

    this.addAction('edit', async (item: ListItem) => {
      await this.db.delete(item.data.id)
      const todo: TodoItem = item.data.content
      const lines = Object.keys(todo).map(key => `${key}: ${todo[key]}`)
      nvim.pauseNotification()
      await nvim.command('tabnew')
      await nvim.command('set filetype=todo')
      await nvim.command('set syntax=yaml') // TODO: use customized highlight instead of yaml syntax
      nvim.command('set nobuflisted', true)
      nvim.command('set buftype=nowrite', true)
      nvim.call('append', ['0', lines], true)
      await nvim.resumeNotification()
    })

    this.addAction('delete', async (item: ListItem) => {
      const { id } = item.data
      await this.db.delete(id)
    }, { persist: true, reload: true })

    this.addAction('cancel', async (item: ListItem) => {
      const todo: TodoItem = item.data.content
      const { id } = item.data
      todo.status = 'cancelled'
      await this.db.update(id, todo)
    }, { persist: true, reload: true })
  }

  public async loadItems(_context: ListContext): Promise<ListItem[]> {
    let arr = await this.db.load()
    let res: ListItem[] = []
    for (let item of arr) {
      let content = item.content.desc
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
