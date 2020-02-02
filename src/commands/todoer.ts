import { workspace } from 'coc.nvim'
import { TodoItem, GistObject } from '../types'
import { statAsync } from '../util/io'
import path from 'path'
import DB from '../util/db'
import { Gist } from '../gists'
import TodolistInfo from '../util/info'
import moment from 'moment'

export default class Todoer {
  private gist: Gist

  constructor(private todoList: DB, private info: TodolistInfo) {
    this.gist = new Gist()
  }

  private async getGitHubToken(): Promise<string> {
    let token = await this.info.fetch('userToken')
    if (!token) {
      token = await workspace.requestInput('Input github token')
      if (!token || token.trim() === '') return
      token = token.trim()
      await this.info.push('userToken', token)
    }
    return token
  }

  public async create(): Promise<void> {
    const todo: TodoItem = {
      desc: '',
      date: new Date().toString(),
      status: 'active',
      remind: false,
      due: null
    }
    const config = workspace.getConfiguration('todolist')

    let desc = await workspace.requestInput('Describe what to do')
    if (!desc || desc.trim() === '') return
    todo.desc = desc.trim()

    const remind = await workspace.requestInput('Set a reminder for you?(y/n)')
    if (remind && remind.trim().toLowerCase() === 'y') {
      todo.remind = true
      const dateFormat = config.get<string>('dateFormat')
      let dueDate = moment().format(dateFormat)
      dueDate = await workspace.requestInput('When to remind you', dueDate)
      if (dueDate && dueDate.trim()) {
        const due = moment(dueDate.trim(), dateFormat).toDate().toString()
        todo.due = due
      }
    }
    await this.todoList.add(todo)
    workspace.showMessage('New todo added')
  }

  public async download(directory: string): Promise<void> {
    let statusItem = workspace.createStatusBarItem(0, { progress: true })
    statusItem.text = 'downloading todolist'
    // if gist id exists, use that to download gist
    let gistid = await this.info.fetch('gistId')
    if (!gistid || gistid.trim() === '') {
      gistid = await workspace.requestInput('Input gist id')
      if (!gistid || gistid.trim() === '') return
      gistid = gistid.trim()
      await this.info.push('gistId', gistid)
    }

    statusItem.show()
    const res = await this.gist.get(`/gists/${gistid}`)
    statusItem.hide()
    if (res.status == 200 && res.responseText) {
      const gist: GistObject = JSON.parse(res.responseText)
      const todoFile = path.join(directory, 'todolist.json')
      const todoFileBak = path.join(directory, 'todolist.json.old')
      const stat = await statAsync(todoFile)
      if (stat && stat.isFile()) {
        await workspace.renameFile(todoFile, todoFileBak, { overwrite: true })
      }

      const { content } = gist.files['todolist.json']
      if (content) {
        const todos: TodoItem[] = JSON.parse(content)
        await this.todoList.updateAll(todos)
        workspace.showMessage('Downloaded todolist from gist')
      }
    } else if (res.status === 404) {
      workspace.showMessage('Remote gist was not found', 'error')
      await this.info.delete('gistId')
      return
    } else {
      workspace.showMessage('Downloading error', 'error')
      return
    }
  }

  public async upload(): Promise<void> {
    let statusItem = workspace.createStatusBarItem(0, { progress: true })
    statusItem.text = 'uploading todolist'

    this.gist.token = await this.getGitHubToken() // TODO

    const record = await this.todoList.load()
    const todo = record.map(i => i.todo)
    const gistObj: GistObject = {
      description: 'coc-todolist gist',
      public: false,
      files: {
        'todolist.json': {
          content: JSON.stringify(todo, null, 2)
        }
      }
    }
    const data = Buffer.from(JSON.stringify(gistObj))

    // If gistId exists, upload
    let gistId = await this.info.fetch('gistId')
    if (gistId && gistId.trim()) {
      statusItem.show()
      const res = await this.gist.patch(`/gists/${gistId}`, data)
      statusItem.hide()
      if (res.status === 200) {
        workspace.showMessage('Updated gist todolist')
        await this.updateLog()
        return
      } else if (res.status !== 404) {
        workspace.showMessage('Failed to uploaded todo gist', 'error')
        return
      } else { // 404: delete gistId and create a new gist
        workspace.showMessage('Remote gist was not found', 'error')
        await this.info.delete('gistId')
      }
    }
    // gistId doesn't exists, fallback to creating
    const res = await this.gist.post('/gists', data)
    if (res.status == 201 && res.responseText) {
      const gist: GistObject = JSON.parse(res.responseText)
      await this.info.push('gistId', gist.id)
      workspace.showMessage('Uploaded a new todolist to gist')
      await this.updateLog()
    } else {
      workspace.showMessage('Failed to create todolist from gist', 'error')
      return
    }
  }

  private async updateLog(): Promise<void> {
    const now = new Date()
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    await this.info.push('lastUpload', day.getTime())
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
