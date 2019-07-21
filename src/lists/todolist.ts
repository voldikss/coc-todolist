'use strict'
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
        todo.status = 'active'
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
      let desc = item.data.content.desc
      const status = item.data.content.status
      const date = new Date().toString()
      desc = await workspace.requestInput('Input new description', desc) || desc

      const { id } = item.data
      const todo: TodoItem = { desc, date, status }
      await this.db.update(id, todo)
    })

    this.addAction('delete', async (item: ListItem) => {
      const { id } = item.data
      await this.db.delete(id)
    }, { persist: true, reload: true })
  }

  private compare(a: TodoItem, b: TodoItem): number {
    const priority = new Map<string, number>()
    priority.set('active', 1)
    priority.set('completed', 2)

    return priority.get(a.status) - priority.get(b.status)
  }

  public async loadItems(_context: ListContext): Promise<ListItem[]> {
    const arr = await this.db.load()
    let res: ListItem[] = []
    for (const item of arr) {
      let { desc, date, status } = item.content
      const icon = {
        active: '🕐',
        completed: '✔️ ',
      }
      const shortcut = icon[status]

      res.push({
        label: `${shortcut} ${desc}\t\tcreated at: ${date}`,
        filterText: desc + status,
        data: Object.assign({}, item)
      })
    }

    await this.db.dump(arr)

    res = res.sort((a, b) => {
      return this.compare(a.data.content, b.data.content)
    })

    return res
  }

  public doHighlight(): void {
    let { nvim } = this
    nvim.pauseNotification()
    nvim.command('syntax match TodoDesc /\\v^.*\t/', true)
    nvim.command('syntax match TodoKeyword /\\vcreated at/', true)
    nvim.command('syntax match TodoDue /\\vcreated at:.*$/ contains=TodoKeyword', true)
    nvim.command('highlight default link TodoDesc String', true)
    nvim.command('highlight default link TodoKeyword Keyword', true)
    nvim.command('highlight default link TodoDue Comment', true)
    nvim.resumeNotification().catch(_e => {
      // noop
    })
  }
}
