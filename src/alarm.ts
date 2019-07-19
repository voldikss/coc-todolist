import { workspace, Window } from 'coc.nvim'
import Highlighter from 'coc.nvim/lib/model/highligher'
import { TodoItem, Notification } from './types'
import DB from './util/db'
import { FloatOptions } from '@chemzqm/neovim/lib/api/types'
import FloatWin from './float'

export class Alarm {
  private db: DB
  public alertType: string = null
  public interval: NodeJS.Timeout
  public floating: FloatWin
  constructor(db: DB) {
    this.db = db
    this.floating = new FloatWin(2) // TODO
  }

  public async new(todo: TodoItem): Promise<void> {
    await this.db.add(todo)
  }

  public async delete(uid: string): Promise<void> {
    await this.db.delete(uid)
  }

  public async monitor(alertType: string): Promise<void> {
    this.alertType = alertType
    ////////////////// test
    const alarm = await this.db.load()
    if (!alarm || alarm.length === 0)
      return
    const todo = alarm[0].content
    // await this.notify(todo)
    await this.notify(todo)
    await this.notify(todo)
    await this.notify(todo)
    return
    ////////////////// test
    this.interval = setInterval(async () => {
      const alarm = await this.db.load()
      if (!alarm || alarm.length === 0)
        return

      const now = new Date().getTime()
      for (const a of alarm) {
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
    const { nvim } = workspace
    const buf = await nvim.createNewBuffer()
    buf.setOption('bufhidden', 'wipe', true)
    buf.setOption('buftype', 'nowrite', true)
    let height = await nvim.eval('winheight(0)')
    let width = await nvim.getOption('columns')

    const hl = new Highlighter()
    const margin = ' '.repeat(Math.floor((30 - notification.title.length) / 2))
    hl.addLine(`${margin}${notification.title}`, 'Title')
    for (const [item, detail] of Object.entries(notification.content)) {
      hl.addLine(item, 'Keyword')
      hl.addText(': ')
      hl.addText(detail, 'String')
    }
    hl.render(buf)

    const floatWidth = 30 // TODO
    const winConfig: FloatOptions = {
      focusable: false,
      relative: 'editor',
      anchor: 'NW',
      height: Object.keys(notification.content).length + 1,
      width: floatWidth,
      row: Number(height.toString()) - Object.keys(notification.content).length,
      col: Number(width.toString()) - floatWidth,
    }

    await this.floating.new(buf, winConfig)
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

    if (this.alertType === 'floating') {
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
