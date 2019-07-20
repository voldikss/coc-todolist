import { workspace } from 'coc.nvim'
import { TodoItem, TodoStatus } from '../types'
import { statAsync } from '../util/io'
import GitHubService from '../service'
import path from 'path'
import DB from '../util/db'
import Reminder from './reminder'
import Config from '../util/config'

export default class Todo {
  private github: GitHubService

  constructor(private reminder: Reminder, private extCfg: Config) {
    this.github = new GitHubService(this.extCfg)
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
    const init = await this.github.init()
    if (!init) return

    // if gist id exists, use that to download gist
    let gistId = await this.extCfg.fetch('gistId')
    if (!gistId || gistId.trim() === '') {
      gistId = await workspace.requestInput('Input gist id')
      if (!gistId || gistId.trim() === '')
        return
      gistId = gistId.trim()
      await this.extCfg.push('gistId', gistId)
    }
    const gist = await this.github.read(gistId)

    const todoPath = path.join(directory, 'todolist.json')
    const todoPathOld = path.join(directory, 'todolist.json.old')
    const todoStat = await statAsync(todoPath)

    if (todoStat && todoStat.isFile()) {
      await workspace.renameFile(todoPath, todoPathOld)
    }

    const content = gist.data.files['todolist.json']['content']
    if (content) {
      const todos: TodoItem[] = JSON.parse(content)
      await db.updateAll(todos)
      workspace.showMessage('Downloaded todolist from gist')
    }
  }

  public async upload(db: DB): Promise<void> {
    let uploaded = 0
    const init = await this.github.init()
    if (!init) return

    const todo = await db.load()
    const gist = todo.map(t => t.content)

    const gistId = await this.extCfg.fetch('gistId')
    if (gistId && gistId.trim() !== '') {
      let gistObj = {
        gist_id: gistId,
        files: {
          'todolist.json': {
            content: JSON.stringify(gist, null, 2)
          }
        }
      }
      const status = await this.github.update(gistObj)
      if (status) {
        uploaded = 1
        workspace.showMessage('Uploaded todolist to gist')
      }
      else
        workspace.showMessage('Failed to uploaded todo gist')
    } else {
      let gistObj = {
        description: "coc-todolist",
        files: {
          'todolist.json': {
            content: JSON.stringify(gist, null, 2)
          }
        }
      }
      const gistId = await this.github.create(gistObj)
      if (gistId) {
        await this.extCfg.push('gistId', gistId)
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
