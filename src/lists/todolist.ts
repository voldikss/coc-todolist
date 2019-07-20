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

// TODO: delete not work because of rewrite

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

  private compare(a: TodoItem, b: TodoItem): number {
    const priority = new Map<string, number>()
    priority.set('active', 1)
    priority.set('outdated', 2)
    priority.set('completed', 3)
    priority.set('cancelled', 4)

    return priority.get(a.status) - priority.get(b.status)
  }

  public async loadItems(_context: ListContext): Promise<ListItem[]> {
    const arr = await this.db.load()
    let res: ListItem[] = []
    for (const [idx, item] of arr.entries()) {
      const content = item.content.desc
      let status = item.content.status
      const due = item.content.due
      if (due && Date.parse(due) < Number(new Date().getTime())) {
        workspace.showMessage('outdated')
        arr[idx].content.status = 'outdated'
        status = 'outdated'
      }
      const icon = {
        active: '🕐',
        completed: '✔️ ',
        cancelled: '🚫',
        outdated: '❌'
      }
      const shortcut = icon[status]

      res.push({
        label: `${shortcut} ${content}\t\t${due ? 'DUE: ' + due : ''}`,
        filterText: content + status,
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
    nvim.command('syntax match TodoKeyword /\\vDUE/', true)
    nvim.command('syntax match TodoDue /\\vDUE:.*$/ contains=TodoKeyword', true)
    nvim.command('highlight default link TodoDesc String', true)
    nvim.command('highlight default link TodoKeyword Keyword', true)
    nvim.command('highlight default link TodoDue Comment', true)
    nvim.resumeNotification().catch(_e => {
      // noop
    })
  }
}
