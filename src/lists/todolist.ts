import {
  ListAction,
  ListContext,
  ListItem,
  BasicList,
  Neovim,
  workspace,
} from 'coc.nvim'
import { TodoItem, TodoData } from '../types'
import DB from '../util/db'

export default class TodoList extends BasicList {
  public readonly name = 'todolist'
  public readonly description = 'todolist'
  public readonly defaultAction = 'toggle'
  public actions: ListAction[] = []

  constructor(protected nvim: Neovim, private todoList: DB) {
    super(nvim)

    this.addAction('toggle', async (item: ListItem) => {
      const { todo, uid } = item.data as TodoData
      const { status } = todo
      if (status === 'active') {
        todo.status = 'archived'
      } else if (status === 'archived') {
        todo.status = 'active'
      }
      await this.todoList.update(uid, todo)
    }, { persist: true, reload: true })

    this.addAction('preview', async (item: ListItem, context) => {
      const { todo } = item.data as TodoData
      const lines = Object.keys(todo).map(key => `${key}: ${todo[key]}`)
      await this.preview({
        bufname: 'todolist',
        sketch: true,
        filetype: 'yaml',
        lines,
      }, context)
    }, { persist: true, reload: true })

    this.addAction('edit', async (item: ListItem) => {
      const { uid } = item.data as TodoData
      const todo = item.data.todo
      const date = new Date().toString()
      const desc = await workspace.requestInput('Input new description', todo.desc)
      todo.date = date
      todo.desc = desc.trim()
      await this.todoList.update(uid, todo)
    })

    this.addAction('delete', async (item: ListItem) => {
      const { uid } = item.data as TodoData
      await this.todoList.delete(uid)
    }, { persist: true, reload: true })
  }

  private compare(a: TodoItem, b: TodoItem): number {
    const priority = new Map<string, number>()
    priority.set('active', 1)
    priority.set('completed', 2)

    return priority.get(a.status) - priority.get(b.status)
  }

  public async loadItems(_context: ListContext): Promise<ListItem[]> {
    const arr = await this.todoList.load()
    let res: ListItem[] = []
    for (const item of arr) {
      let { desc, date, status } = item.todo
      const icon = {
        active: '⏱',
        archived: '✔️',
      }
      const shortcut = icon[status]

      res.push({
        label: `${shortcut} ${desc}\t\tcreated at: ${date}`,
        filterText: desc + status,
        data: Object.assign({}, item)
      })
    }

    res = res.sort((a, b) => this.compare(a.data.todo, b.data.todo))
    return res
  }

  public doHighlight(): void {
    let { nvim } = this
    nvim.pauseNotification()
    nvim.command('syntax match TodoDesc /\\v^.*\t/', true)
    nvim.command('syntax match TodoKeyword /\\vcreated at/', true)
    nvim.command('syntax match TodoDate /\\vcreated at:.*$/ contains=TodoKeyword', true)
    nvim.command('highlight default link TodoDesc String', true)
    nvim.command('highlight default link TodoKeyword Type', true)
    nvim.command('highlight default link TodoDate Comment', true)
    nvim.resumeNotification().catch(_e => {
      // nop
    })
  }
}
