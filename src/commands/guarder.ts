import { workspace, WorkspaceConfiguration, Neovim, events } from 'coc.nvim'
import { TodoItem, Notification } from '../types'
import DB from '../util/db'
import FloatWindow from '../ui/floatWindow'
import VirtualText from '../ui/virtualText'
import { Dispose } from '../util/dispose'

export default class Guarder extends Dispose {
  private interval: NodeJS.Timeout
  private config: WorkspaceConfiguration
  private floating: FloatWindow
  private virtual: VirtualText

  constructor(private nvim: Neovim, private todoList: DB) {
    super()
    this.config = workspace.getConfiguration('todolist.reminder')
    workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('todolist.reminder')) {
        this.config = workspace.getConfiguration('todolist.reminder')
      }
    })

    this.floating = new FloatWindow(nvim, this.config)
    this.virtual = new VirtualText(nvim)
  }

  private async notify(todo: TodoItem): Promise<void> {
    const notice: Notification = {
      title: ' 🗁  TodoList Guarder',
      content: {
        '🗒': todo.desc,
        '🗓': new Date(todo.date).toLocaleString(),
        '🕭': new Date(todo.due).toLocaleString()
      }
    }
    const msg = `TODO: ${todo.desc} ${todo.due ? 'at ' + todo.due : ''}`
    const type = this.config.get<string>('notify', 'floating')

    switch (type) {
      case 'floating':
        try {
          await this.floating.start(notice)
          return
        } catch (_e) {
          workspace.showMessage(_e)
          // does not support floating window
        }
      case 'virtual':
        try {
          const buffer = await this.nvim.buffer
          const bufnr = buffer.id
          const lnum = await this.nvim.call('line', ['.'])
          await this.virtual.showInfo(bufnr, lnum, msg)

          // TODO: how to delete this event?
          events.on('CursorMoved', async (bufnr, cursor) => {
            await this.virtual.showInfo(bufnr, cursor[0], msg)
          })
          return
        } catch (_e) {
          // does not support virtual text
        }
      case 'echo':
        workspace.showMessage(msg)
        return
      default:
        return
    }
  }

  public async deactive(uid: string, todo: TodoItem): Promise<void> {
    todo.status = 'archived'
    await this.todoList.update(uid, todo)
  }

  public async monitor(): Promise<void> {
    this.interval = setInterval(async () => {
      const todolist = await this.todoList.load()
      if (!todolist || todolist.length === 0) return
      const now = new Date().getTime()
      for (const a of todolist) {
        const { todo, uid } = a
        const { due, status, remind } = todo
        if (remind && due && Date.parse(due) <= now && status == 'active') {
          await this.notify(todo)
          await this.deactive(uid, todo)
        }
      }
    }, 1000) // TODO
  }

  public async clearNotice(): Promise<void> {
    await this.floating.destroy()
    await this.virtual.destroy()
  }

  public stopGuard(): void {
    if (this.interval) clearInterval(this.interval)
  }

  public dispose(): void {
    // tslint:disable-next-line: no-floating-promises
    this.clearNotice()
    this.stopGuard()
  }
}
