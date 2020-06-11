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
import moment from 'moment'
import { createTodoEditBuffer } from '../util/helper'

export default class TodoList extends BasicList {
  public readonly name = 'todolist'
  public readonly description = 'todolist'
  public readonly defaultAction = 'toggle'
  public actions: ListAction[] = []

  constructor(protected nvim: Neovim, private db: DB) {
    super(nvim)

    this.addAction('toggle', async (item: ListItem) => {
      const { todo, uid } = item.data as TodoData
      const { active } = todo
      if (active) {
        todo.active = false
      } else {
        todo.active = true
      }
      await this.db.update(uid, todo)
    }, { persist: true, reload: true })

    this.addAction('preview', async (item: ListItem, context) => {
      const { todo } = item.data as TodoData
      const lines = []
      lines.push(`Topic: ${todo.topic}`)
      lines.push(`Date: ${todo.date}`)
      lines.push(`Active: ${todo.active}`)
      lines.push(`Due: ${todo.due}`)
      lines.push(`Description:`)
      lines.push(...todo.description.split('\n'))
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
      const config = workspace.getConfiguration('todolist')
      if (!config.get<boolean>('easyMode')) {
        await createTodoEditBuffer(todo, this.db, 'update', uid)
        return
      }
      const topic = await workspace.requestInput('Input new topic', todo.topic)
      if (!topic || topic.trim() === '') return
      todo.topic = topic.trim()
      if (config.get<boolean>('promptForReminder')) {
        const remind = await workspace.requestInput('Set a due date?(y/N)')
        if (!remind || remind.trim() === '') return
        if (remind.trim().toLowerCase() === 'y') {
          const dateFormat = config.get<string>('dateFormat')
          let dueDate = moment().format(dateFormat)
          dueDate = await workspace.requestInput('When to remind you', dueDate)
          if (!dueDate || dueDate.trim() === '') return
          todo.due = moment(dueDate.trim(), dateFormat).toDate().toString()
        }
      }
      await this.db.update(uid, todo)
      workspace.showMessage('Todo item updated')
    })

    this.addAction('delete', async (item: ListItem) => {
      const { uid } = item.data as TodoData
      await this.db.delete(uid)
    }, { persist: true, reload: true })
  }

  private compare(a: TodoItem, b: TodoItem): number {
    const priority = new Map<boolean, number>()
    priority.set(true, 1)
    priority.set(false, 2)
    return priority.get(a.active) - priority.get(b.active)
  }

  public async loadItems(_context: ListContext): Promise<ListItem[]> {
    const arr = await this.db.load()
    let res: ListItem[] = []
    for (const item of arr) {
      const { topic, active, description } = item.todo
      const shortcut = active ? '[*]' : '[√]'
      const label = `${shortcut} ${topic} \t ${description ? description : ''}`
      res.push({
        label,
        filterText: topic,
        data: Object.assign({}, item)
      })
    }
    res = res.sort((a, b) => this.compare(a.data.todo, b.data.todo))
    return res
  }

  public doHighlight(): void {
    const { nvim } = this
    nvim.pauseNotification()
    nvim.command('syn match CocTodolistStatus /\\v\\[.\\]/', true)
    nvim.command('syn match CocTodolistTopic /\\v%4v.*\\t/', true)
    nvim.command('syn match CocTodolistDescription /.*/ contains=CocTodolistStatus,CocTodolistTopic', true)
    nvim.command('hi def link CocTodolistStatus Constant', true)
    nvim.command('hi def link CocTodolistTopic String', true)
    nvim.command('hi def link CocTodolistDescription Comment', true)
    nvim.resumeNotification().catch(_e => {
      // nop
    })
  }
}
