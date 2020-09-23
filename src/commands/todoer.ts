import { workspace } from 'coc.nvim'
import { TodoItem, GistObject } from '../types'
import { fsStat } from '../util/fs'
import path from 'path'
import DB from '../util/db'
import { Gist } from '../service/gists'
import TodolistInfo from '../util/info'
import moment from 'moment'
import { newTodo, createTodoEditBuffer } from '../util/helper'

export default class Todoer {
  private gist: Gist

  constructor(private db: DB, private info: TodolistInfo) {
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
    const todo = newTodo()
    const config = workspace.getConfiguration('todolist')
    if (!config.get<boolean>('easyMode')) {
      await createTodoEditBuffer(todo, this.db, 'create')
      return
    }
    const topic = await workspace.requestInput('Input the topic')
    if (!topic || topic.trim() === '') return
    todo.topic = topic.trim()
    if (config.get<boolean>('promptForReminder')) {
      const remind = await workspace.requestInput('Set a due date?(y/N)')
      if (!remind || remind.trim() === '') return
      if (remind.trim().toLowerCase() === 'y') {
        const dateFormat = config.get<string>('dateFormat')
        let dueDate = moment().format(dateFormat)
        dueDate = await workspace.requestInput('When to remind you', dueDate)
        if (!dueDate || dueDate.trim() === '') return
        todo.due = moment(dueDate.trim(), dateFormat).toDate().toString()
      }
    }
    await this.db.add(todo)
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
      const stat = await fsStat(todoFile)
      // backup old todolist file
      if (stat && stat.isFile()) {
        await workspace.renameFile(todoFile, todoFileBak, { overwrite: true })
      }

      // update todolist
      const { content } = gist.files['todolist.json']
      if (content) {
        const todos: TodoItem[] = JSON.parse(content)
        await this.db.updateAll(todos)
        workspace.showMessage('Downloaded todolist from gist')
      }

      // update github username
      await this.info.push('userName', gist.owner.login)
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

    const record = await this.db.load()
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
        // update github username
        const gist: GistObject = JSON.parse(res.responseText)
        await this.info.push('userName', gist.owner.login)
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
      // update github username
      await this.info.push('userName', gist.owner.login)
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
    const arr = await this.db.load()
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

  public async clear(): Promise<void> {
    await this.db.clear()
    workspace.showMessage('All todos were cleared')
  }
}
