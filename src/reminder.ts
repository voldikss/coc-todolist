import { workspace, WorkspaceConfiguration } from 'coc.nvim'
import { TodoItem, Notification } from './types'
import { FloatOptions } from '@chemzqm/neovim/lib/api/types'
import Highlighter from 'coc.nvim/lib/model/highligher'
import DB from './util/db'
import FloatWindow from './floatWindow'

export default class Reminder {
  public interval: NodeJS.Timeout
  private floating: FloatWindow
  private config: WorkspaceConfiguration

  constructor(private nvim, private db: DB) {
    this.config = workspace.getConfiguration('todolist.reminder')
    workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('todolist.reminder')) {
        this.config = workspace.getConfiguration('todolist.reminder')
      }
    })

    this.floating = new FloatWindow(nvim, this.config)
  }

  public async create(todo: TodoItem): Promise<void> {
    await this.db.add(todo)
  }

  public async delete(uid: string): Promise<void> {
    await this.db.delete(uid)
  }

  public async monitor(): Promise<void> {
    ////////////////// test
    const remind = await this.db.load()
    if (!remind || remind.length === 0)
      return
    const todo = remind[0].content
    await this.notify(todo)
    await this.notify(todo)
    await this.notify(todo)
    await this.notify(todo)
    return
    ////////////////// test
    this.interval = setInterval(async () => {
      const remind = await this.db.load()
      if (!remind || remind.length === 0)
        return

      const now = new Date().getTime()
      for (const a of remind) {
        const due = a.content.due
        if (Date.parse(due) <= now) {
          await this.notify(a.content)
          await this.db.delete(a.id)
        }
      }
    }, 1000)
  }

  public clear(): void {
    clearInterval(this.interval)
  }

  public async bubble(notification: Notification): Promise<void> {
    const buf = await this.nvim.createNewBuffer()
    buf.setOption('bufhidden', 'wipe', true)
    buf.setOption('buftype', 'nowrite', true)

    const hl = new Highlighter()
    const margin = ' '.repeat(Math.floor((30 - notification.title.length) / 2)) // TODO
    hl.addLine(`${margin}${notification.title}`, 'Title')
    for (const [item, detail] of Object.entries(notification.content)) {
      hl.addLine(item, 'Keyword')
      hl.addText(': ')
      hl.addText(detail, 'String')
    }

    // buf was also updated
    hl.render(buf)

    await this.floating.create(buf)
  }

  public async notify(todo: TodoItem): Promise<void> {
    const notification: Notification = {
      title: '🔔 TodoList Reminder',
      content: {
        '📝': todo.desc,
        '📅': new Date(todo.date).toLocaleString(),
        '⏰': new Date(todo.due).toLocaleString()
      }
    }

    const alertType = this.config.get<string>('alertType', 'floating')
    if (alertType === 'floating') {
      try {
        await this.bubble(notification)
        return
      } catch (_e) {
        workspace.showMessage(_e)
        // does not support floating
      }
    }

    const alertMsg = `${notification.title}: ${todo.desc} at ${todo.due}`
    workspace.showMessage(alertMsg)
  }
}
