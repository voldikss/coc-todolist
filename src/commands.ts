import { workspace } from 'coc.nvim'
import { TodoItem, TodoStatus } from './types'
import { statAsync } from './util/io'
import Gist from './gist'
import path from 'path'
import DB from './util/db'
import Reminder from './reminder'
import Config from './util/config'

export default class Todo {
  constructor(private reminder: Reminder, private extCfg: Config) { }

  private async getToken(): Promise<string> {
    let token = await this.extCfg.fetch('userToken')
    if (!token) {
      token = await workspace.requestInput('Input github token')
      if (!token || token.trim() === '')
        return
      token = token.trim()
      await this.extCfg.push('userToken', token)
    }
    return token
  }

  public async create(db: DB): Promise<void> {
    let desc: string
    let date: string
    let status: TodoStatus
    let due: string | null

    desc = await workspace.requestInput('Describe what to do')
    if (!desc || desc.trim() === '')
      return

    desc = desc.trim()
    // date = await workspace.nvim.call('strftime', '%Y-%m-%d %T')
    date = new Date().toString()
    status = 'active'

    due = await workspace.requestInput('When to remind you', date)
    if (due && due.trim() !== '')
      due = new Date(Date.parse(due.trim())).toString()

    const todo: TodoItem = { desc, status, date, due }
    await db.add(todo)

    if (due !== date)
      await this.reminder.create(todo)

    workspace.showMessage('New todo added')
  }

  public async download(directory: string, db: DB): Promise<void> {
    const token = await this.getToken()

    let github = new Gist(token)
    // if gist id exists, use that to download gist
    let gistId = await this.extCfg.fetch('gist-id')
    if (!gistId || gistId.trim() === '') {
      gistId = await workspace.requestInput('Input gist id')
      if (!gistId || gistId.trim() === '')
        return
      gistId = gistId.trim()
    }
    const gist = await github.read(gistId)

    const todoPath = path.join(directory, 'todo.json')
    const todoPathOld = path.join(directory, 'todo.json.old')
    const todoStat = await statAsync(todoPath)

    if (todoStat && todoStat.isFile()) {
      await workspace.renameFile(todoPath, todoPathOld)
    }

    const content = gist.data.files['todolist.json']['content']
    if (content) {
      const todo: TodoItem[] = JSON.parse(content)
      todo.map(async t => await db.add(t))
    }
  }

  public async upload(db: DB): Promise<void> {
    let uploaded = 0
    const token = await this.getToken()

    let github = new Gist(token)

    const todo = await db.load()
    const gist = todo.map(t => t.content)

    const gistId = await this.extCfg.fetch('gist-id')
    if (gistId && gistId.trim() !== '') {
      let gistObj = {
        gist_id: gistId,
        files: {
          'todolist.json': {
            content: JSON.stringify(gist, null, 2)
          }
        }
      }
      const status = await github.update(gistObj)
      if (status) {
        uploaded = 1
        workspace.showMessage('Todo gist updated')
      }
      else
        workspace.showMessage('Failed to update todo gist')
    } else {
      let gistObj = {
        description: "coc-todolist",
        files: {
          'todolist.json': {
            content: JSON.stringify(gist, null, 2)
          }
        }
      }
      const gistId = await github.create(gistObj)
      if (gistId) {
        await this.extCfg.push('gist-id', gistId)
        uploaded = 1
        workspace.showMessage('Todo gist created')
      }
      else {
        workspace.showMessage('Failed to create todo gist')
      }
    }

    if (uploaded) {
      const now = new Date()
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      await this.extCfg.push('lastUpload', day.getTime())
    }
  }

  public async export(db: DB): Promise<void> {
    const { nvim } = workspace
    const todoDB = await db.load()
    const todo = todoDB.map(t => t.content)
    const filetype = await nvim.call('confirm', ['Export filetype:', '&JSON\n&YAML'])

    if (filetype === 1) {
      const lines = JSON.stringify(todo, null, 2).split('\n')
      await nvim.command('tabnew')
      await nvim.command('set syntax=json')
      await nvim.call('append', [0, lines])
    } else if (filetype === 2) {
      const lines = todo.map(t => {
        return Object.keys(t).map(key => `${key}: ${t[key]}`).join('\n')
      }).join('\n\n').split('\n')
      await nvim.command('tabnew')
      await nvim.command('set syntax=yaml')
      await nvim.call('append', [0, lines])
    } else {
      return
    }
  }
}
