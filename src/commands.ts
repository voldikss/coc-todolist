import { workspace } from 'coc.nvim'
import path from 'path'
import { GitHubService } from './gist'
import { TodoItem, TodoStatus } from './types'
import DB from './util/db'
import { statAsync, readFile, writeFile } from './util/io'
import { Alarm } from './alarm'

export class TodoCommand {
  constructor(private alarm: Alarm) {
    this.alarm = alarm
  }

  private async getGistId(directory: string): Promise<string> {
    let gistId = ''
    const gist_id_file = path.join(directory, 'gist-id.json')
    let stat = await statAsync(gist_id_file)
    if (stat && stat.isFile()) {
      let gist_id_text = await readFile(gist_id_file)
      let gist_id_json = JSON.parse(gist_id_text)
      gistId = gist_id_json['gist_id']
    }
    return gistId
  }

  // TODO: get set method?
  private async saveGistId(directory: string, gistId: string): Promise<void> {
    const gist_id_file = path.join(directory, 'gist-id.json')
    await writeFile(gist_id_file, JSON.stringify({ gistId }))
  }

  private async getUserToken(directory: string): Promise<string> {
    let token: string
    const token_file = path.join(directory, 'token.json')
    let token_stat = await statAsync(token_file)
    if (token_stat && token_stat.isFile()) {
      let token_text = await readFile(token_file)
      let token_json = JSON.parse(token_text)
      token = token_json['token']
    } else {
      token = await workspace.requestInput('Input github token')
      if (!token || token.trim() === '')
        return
      token = token.trim()
      await writeFile(token_file, JSON.stringify({ token }))
    }
    return token
  }

  public async new(db: DB): Promise<void> {
    let desc: string
    let date: string
    let status: TodoStatus
    let due: string | null

    desc = await workspace.requestInput('Describe todo content')
    if (!desc || desc.trim() === '')
      return

    desc = desc.trim()
    // date = await workspace.nvim.call('strftime', '%Y-%m-%d %T')
    date = new Date().toString()
    status = 'active'

    due = await workspace.requestInput('Enter remind time(default)', date)
    if (due && due.trim() !== '')
      due = new Date(Date.parse(due.trim())).toString()

    const todo: TodoItem = { desc, status, date, due }
    await db.add(todo)

    if (due !== date)
      await this.alarm.new(todo)

    workspace.showMessage("new todo added")
  }

  public async  update(db: DB): Promise<void> {
    const doc = await workspace.document
    const filetype = await doc.buffer.getOption('filetype')
    if (!(filetype && filetype === 'todo'))
      return

    let text: string
    if (doc && doc.textDocument) {
      text = doc.textDocument.getText()
      if (!text)
        return
    }

    // TODO: check invalid
    const todo = {} as TodoItem
    const lines = text.trim().split('\n')
    for (const i of Object.keys(lines)) {
      let line = lines[i]
      let [key, value] = line.split(':')
      todo[key.trim()] = value.trim()
    }

    // TODO
    await db.add(todo)

    workspace.showMessage("todo updated")
  }

  public async download(directory: string, db: DB): Promise<void> {
    const token = await this.getUserToken(directory)

    let github = new GitHubService(token)
    // if gist id exists, use that to download gist
    let gistId = await this.getGistId(directory)
    if (!gistId || gistId.trim() === '') {
      gistId = await workspace.requestInput('Input gist id')
      if (!gistId || gistId.trim() === '')
        return
      gistId = gistId.trim()
    }
    const gist = await github.readGist(gistId)

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

  public async upload(directory: string, db: DB): Promise<void> {
    // TODO: this.login()
    const token = await this.getUserToken(directory)

    // d280ab7a208cc0cc4c55a1935ce59dc4ec9de1ca
    let github = new GitHubService(token)

    const todo = await db.load()
    const gist = todo.map(t => t.content)

    const gistId = await this.getGistId(directory)
    if (gistId && gistId.trim() !== '') {
      let gistObj = {
        gistId,
        files: {
          'todolist.json': {
            content: JSON.stringify(gist, null, 2)
          }
        }
      }
      const status = await github.updateGist(gistObj)
      if (status)
        workspace.showMessage('todo gist updated')
      else
        workspace.showMessage('failed to update todo gist')
    } else {
      let gistObj = {
        description: "coc-todolist",
        files: {
          'todolist.json': {
            content: JSON.stringify(gist, null, 2)
          }
        }
      }
      const gistId = await github.createGist(gistObj)
      if (gistId) {
        await this.saveGistId(directory, gistId)
        workspace.showMessage('todo gist created')
      }
      else {
        workspace.showMessage('failed to create todo gist')
      }
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
