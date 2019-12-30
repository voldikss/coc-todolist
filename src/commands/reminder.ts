import { workspace, WorkspaceConfiguration, Neovim, events } from 'coc.nvim'
import { TodoItem, Notification } from '../types'
import DB from '../util/db'
import FloatWindow from '../ui/floatWindow'
import VirtualText from '../ui/virtualText'
import { Dispose } from '../util/dispose'

export default class Reminder extends Dispose {
  private interval: NodeJS.Timeout
  private config: WorkspaceConfiguration
  private floating: FloatWindow
  private virtual: VirtualText

  constructor(private nvim: Neovim, private remindList: DB) {
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

  private async notify(remind: TodoItem): Promise<void> {
    const notice: Notification = {
      title: '🔔 TodoList Reminder',
      content: {
        '📝': remind.desc,
        '📅': new Date(remind.date).toLocaleString(),
        '⏰': new Date(remind.due).toLocaleString()
      }
    }
    const msg = `TODO: ${remind.desc} ${remind.due ? 'at ' + remind.due : ''}`
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

  public async add(todo: TodoItem): Promise<void> {
    await this.remindList.add(todo)
  }

  public async delete(uid: string): Promise<void> {
    await this.remindList.delete(uid)
  }

  public async monitor(): Promise<void> {
    this.interval = setInterval(async () => {
      const remind = await this.remindList.load()
      if (!remind || remind.length === 0)
        return

      const now = new Date().getTime()
      for (const a of remind) {
        const { todo, id } = a
        const { due } = todo
        if (Date.parse(due) <= now) {
          await this.notify(todo)
          await this.remindList.delete(id)
        }
      }
    }, 1000)
  }

  public async clearNotice(): Promise<void> {
    await this.floating.destroy()
    await this.virtual.destroy()
  }

  public stopRemind(): void {
    if (this.interval) clearInterval(this.interval)
  }

  public dispose(): void {
    // tslint:disable-next-line: no-floating-promises
    this.clearNotice()
    this.stopRemind()
  }
}
