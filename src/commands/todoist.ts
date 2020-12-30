import { window, workspace } from 'coc.nvim'
import { TodoItem, GistObject } from '../types'
import { fsStat } from '../util/fs'
import path from 'path'
import DB from '../util/db'
import { Gist } from '../service/gists'
import Profile from '../profile'
import { createTodo, createTodoEditBuffer } from '../util/helper'

export default class Todoist {
  private gist: Gist

  constructor(private db: DB, private profile: Profile) {
    this.gist = new Gist()
  }

  private async getGitHubToken(): Promise<string> {
    let token: string = await this.profile.fetch('userToken')
    if (!token) {
      token = await window.requestInput('Input github token')
      if (!(token?.trim().length > 0)) return
      token = token.trim()
      await this.profile.push('userToken', token)
    }
    return token
  }

  public async create(): Promise<void> {
    const todo = createTodo()
    await createTodoEditBuffer(todo, this.db, 'create')
  }

  public async download(directory: string): Promise<void> {
    const statusItem = window.createStatusBarItem(0, { progress: true })
    statusItem.text = 'downloading todolist'
    // if gist id exists, use that to download gist
    let gistid: string = await this.profile.fetch('gistId')
    if (!(gistid?.trim().length > 0)) {
      gistid = await window.requestInput('Input gist id')
      if (!(gistid?.trim().length > 0)) return
      gistid = gistid.trim()
      await this.profile.push('gistId', gistid)
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
      if (stat?.isFile()) {
        await workspace.renameFile(todoFile, todoFileBak, { overwrite: true })
      }

      // update todolist
      const { content } = gist.files['todolist.json']
      if (content) {
        const todos: TodoItem[] = JSON.parse(content)
        await this.db.updateAll(todos)
        window.showMessage('Downloaded todolist from gist')
      }

      // update github username
      await this.profile.push('userName', gist.owner.login)
    } else if (res.status === 404) {
      window.showMessage('Remote gist was not found', 'error')
      await this.profile.delete('gistId')
      return
    } else {
      window.showMessage('Downloading error', 'error')
      return
    }
  }

  public async upload(): Promise<void> {
    const statusItem = window.createStatusBarItem(0, { progress: true })
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
    const gistId: string = await this.profile.fetch('gistId')
    if (gistId?.trim().length > 0) {
      statusItem.show()
      const res = await this.gist.patch(`/gists/${gistId}`, data)
      statusItem.hide()
      if (res.status === 200) {
        window.showMessage('Updated gist todolist')
        // update github username
        const gist: GistObject = JSON.parse(res.responseText)
        await this.profile.push('userName', gist.owner.login)
        return
      } else if (res.status !== 404) {
        window.showMessage('Failed to uploaded todo gist', 'error')
        return
      } else { // 404: delete gistId and create a new gist
        window.showMessage('Remote gist was not found', 'error')
        await this.profile.delete('gistId')
      }
    }
    // gistId doesn't exists, fallback to creating
    const res = await this.gist.post('/gists', data)
    if (res.status == 201 && res.responseText) {
      const gist: GistObject = JSON.parse(res.responseText)
      await this.profile.push('gistId', gist.id)
      window.showMessage('Uploaded a new todolist to gist')
      // update github username
      await this.profile.push('userName', gist.owner.login)
    } else {
      window.showMessage('Failed to create todolist from gist', 'error')
      return
    }
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
    window.showMessage('All todos were cleared')
  }
}
