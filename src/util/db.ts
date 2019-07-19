import { statAsync, writeFile, readFile } from './io'
import path from 'path'
import { TodoItem, TodoItemDB } from '../types'
import uuid = require('uuid')

export default class DB {
  private file: string

  constructor(directory: string, name: string, private maxsize: number) {
    this.file = path.join(directory, `${name}.json`)
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

    items.unshift({ id: uuid(), content: todo, path: this.file })

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

  public async update(uid: string, todo: TodoItem): Promise<void> {
    let items = await this.load()
    let idx = items.findIndex(o => o.id == uid)
    if (idx !== -1) {
      items[idx].content = todo
      await writeFile(this.file, JSON.stringify(items, null, 2))
    }
  }
}
