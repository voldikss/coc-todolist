import { statAsync, writeFile, readFile } from './io'
import path from 'path'
import { TodoItem, TodoItemDB } from '../types'
import { workspace } from 'coc.nvim'
import uuid = require('uuid')

export default class DB {
  private file: string

  constructor(directory: string, private maxsize: number) {
    this.file = path.join(directory, 'todo.json')
  }

  public async load(): Promise<TodoItemDB[]> {
    let stat = await statAsync(this.file)
    if (!stat || !stat.isFile()) return []
    let content = await readFile(this.file)
    return JSON.parse(content) as TodoItemDB[]
  }

  public async add(todo: TodoItem): Promise<void> {
    let items = await this.load()
    if (items.length == this.maxsize) {
      items.pop()
    }

    // check duplication
    // let arr = items.map(item => item['content'][0])
    // if (arr.indexOf(content[0]) >= 0) return

    // TODO: improve
    items.unshift({ id: uuid(), content: todo, path: this.file })

    workspace.showMessage(this.file.toString())
    workspace.showMessage(JSON.stringify(items))

    await writeFile(this.file, JSON.stringify(items, null, 2))
  }

  public async delete(uid: string): Promise<void> {
    let items = await this.load()
    let idx = items.findIndex(o => o.id == uid)
    if (idx !== -1) {
      items.splice(idx, 1)
      await writeFile(this.file, JSON.stringify(items, null, 2))
    }
  }
}
