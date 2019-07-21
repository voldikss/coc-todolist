import { workspace } from 'coc.nvim'
import { TodoItem, TodoStatus } from '../types'
import { statAsync } from '../util/io'
import GitHubService from '../service'
import path from 'path'
import DB from '../util/db'
import Reminder from './reminder'
import Config from '../util/config'

export default class Todoer {
  private github: GitHubService

  constructor(private reminder: Reminder, private todoList: DB, private extCfg: Config) {
    this.github = new GitHubService(this.extCfg)
  }

  public async create(): Promise<void> {
    const date: string = new Date().toString()
    const status: TodoStatus = 'active'

    let desc = await workspace.requestInput('Describe what to do')
    if (!desc || desc.trim() === '')
      return
    desc = desc.trim()

    const remind = await workspace.requestInput('Set a reminder for you?(y/n)')
    if (remind && remind.trim().toLowerCase() === 'y') {
      let due = await workspace.requestInput('When to remind you', date)
      if (due && due.trim()) {
        due = new Date(Date.parse(due.trim())).toString()
        await this.reminder.add({ desc, date, due })
      }
    }

    await this.todoList.add({ desc, status, date })
    workspace.showMessage('New todo added')
  }

  public async download(directory: string): Promise<void> {
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

    const todoFile = path.join(directory, 'todolist.json')
    const todoFileOld = path.join(directory, 'todolist.json.old')
    const stat = await statAsync(todoFile)

    if (stat && stat.isFile()) {
      await workspace.renameFile(todoFile, todoFileOld)
    }

    const { content } = gist.data.files['todolist.json']
    if (content) {
      const todos: TodoItem[] = JSON.parse(content)
      await this.todoList.updateAll(todos)
      workspace.showMessage('Downloaded todolist from gist')
    }
  }

  public async upload(): Promise<void> {
    let uploaded = 0
    const init = await this.github.init()
    if (!init) return

    const todo = await this.todoList.load()
    const gist = todo.map(t => t.todo)

    const gistObj = {
      description: 'coc-todolist gist',
      files: {
        'todolist.json': {
          content: JSON.stringify(gist, null, 2)
        }
      }
    }
    let gistId = await this.extCfg.fetch('gistId')
    if (gistId && gistId.trim()) {
      gistObj['gist_id'] = gistId
      const status = await this.github.update(gistObj)
      if (status) {
        uploaded = 1
        workspace.showMessage('Uploaded todolist to gist')
      } else
        workspace.showMessage('Failed to uploaded todo gist')
    } else {
      gistId = await this.github.create(gistObj)
      if (gistId) {
        await this.extCfg.push('gistId', gistId)
        uploaded = 1
        workspace.showMessage('Todo gist created')
      } else {
        workspace.showMessage('Failed to create todo gist')
      }
    }

    if (uploaded) {
      const now = new Date()
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      await this.extCfg.push('lastUpload', day.getTime())
    }
  }

  public async export(): Promise<void> {
    const { nvim } = workspace
    const arr = await this.todoList.load()
    const todo = arr.map(a => a.todo)
    const filetype = await nvim.call('confirm', ['Export filetype:', '&JSON\n&YAML'])

    if (filetype === 1) {
      const lines = JSON.stringify(todo, null, 2).split('\n')
      await nvim.command('tabnew')
      await nvim.command('set syntax=json')
      await nvim.call('append', [0, lines])
    } else if (filetype === 2) {
      const lines = todo.map(t => Object.keys(t)
        .map(key => `${key}: ${t[key]}`)
        .join('\n'))
        .join('\n\n').split('\n')
      await nvim.command('tabnew')
      await nvim.command('set syntax=yaml')
      await nvim.call('append', [0, lines])
    } else {
      return
    }
  }
}
