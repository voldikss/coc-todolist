import { window, workspace } from 'coc.nvim'
import { TodoItem } from '../types'
import DB from '../util/db'
import { Dispose } from '../util/dispose'

export default class Guardian extends Dispose {
  private interval: NodeJS.Timeout

  constructor(private todoList: DB) {
    super()
    const { nvim } = workspace
    nvim.command('hi def link CocTodolistNotification Statement', true)
    nvim.command('hi def link CocTodolistNotificationBorder Special', true)
  }

  private async notify(todo: TodoItem): Promise<void> {
    const message = []
    message.push(`Topic: ${todo.topic}`)
    if (todo.due != todo.date) {
      message.push(`Due: ${new Date(todo.due).toLocaleString()}`)
    }
    if (todo.detail.length > 0) {
      message.push(`'Detail: ${todo.detail}'`)
    }
    await window.showNotification({
      title: 'coc-todolist notification',
      content: message.join('\n'),
      close: true,
      highlight: 'CocTodolistNotification',
      borderhighlight: 'CocTodolistNotificationBorder'
    })
  }

  public async deactive(uid: string, todo: TodoItem): Promise<void> {
    todo.active = false
    await this.todoList.update(uid, todo)
  }

  public async monitor(): Promise<void> {
    this.interval = setInterval(async () => {
      const todolist = await this.todoList.load()
      if (!(todolist?.length > 0)) return
      const now = new Date().getTime()
      for (const a of todolist) {
        const { todo, uid } = a
        const { due, active } = todo
        if (new Date(due).getTime() <= now && due != todo.date && active) {
          await this.notify(todo)
          await this.deactive(uid, todo)
        }
      }
    }, 1000) // TODO
  }

  public stopGuard(): void {
    if (this.interval) clearInterval(this.interval)
  }

  public dispose(): void {
    this.stopGuard()
  }
}
