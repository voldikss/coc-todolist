import { FloatFactory, workspace } from 'coc.nvim'
import { TodoItem } from './types'
import DB from './util/db'
import { FloatOptions } from '@chemzqm/neovim/lib/api/types'

export class Alarm {
  private db: DB
  public alertType: string = null
  public internal: NodeJS.Timeout
  constructor(db: DB) {
    this.db = db
  }

  public async new(todo: TodoItem): Promise<void> {
    await this.db.add(todo)
  }

  public async delete(uid: string): Promise<void> {
    await this.db.delete(uid)
  }

  public async monitor(alertType: string): Promise<void> {
    this.alertType = alertType
    const { nvim } = workspace
    const buf = await nvim.createNewBuffer()
    let height = await nvim.eval('winheight(0)')
    let width = await nvim.getOption('columns')
    const winConfig: FloatOptions = {
      focusable: false,
      relative: 'editor',
      anchor: 'NW',
      height: 5,
      width: 30,
      row: parseInt(height.toString(), 10) - 5,
      col: parseInt(width.toString(), 10) - 30,
    }

    await buf.append(['ddd'])
    const window = await nvim.openFloatWindow(buf, false, winConfig)
    nvim.pauseNotification()
    window.setOption('signcolumn', 'no', true)
    window.setOption('nobuflisted', '', true)
    window.setOption('nonumber', '', true)
    await nvim.resumeNotification()

    this.internal = setInterval(async () => {
      const alarm = await this.db.load()
      if (!alarm)
        return

      const now = new Date().getTime()
      for (const a of alarm) {
        const due = a.content.due
        if (Date.parse(due) <= now) {
          this.notify(a.content)
          // await?
          this.db.delete(a.id).then(() => {/*delete this alarm*/ })
        }
      }
    }, 1000)
  }

  public async notify(todo: TodoItem): Promise<void> {
    if (this.alertType === 'floating') {
      if (workspace.env.floating) {
        const floatFactory = new FloatFactory(workspace.nvim, workspace.env, false)
        const docs = [{ content: `${todo.desc}`, filetype: 'todolist' }]
        await floatFactory.create(docs, false)
        return
      }
    }
    workspace.showMessage(`${todo.desc}`)
  }
}
