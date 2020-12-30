import { fsStat, fsWriteFile, fsReadFile } from './fs'
import path from 'path'
import { TodoItem, TodoData } from '../types'
import uuid = require('uuid')

export default class DB {
  private file: string

  constructor(directory: string, name: string) {
    this.file = path.join(directory, `${name}.json`)
  }

  public async load(): Promise<TodoData[]> {
    const stat = await fsStat(this.file)
    if (!(stat?.isFile())) return []
    const content = await fsReadFile(this.file)
    return JSON.parse(content) as TodoData[]
  }

  public async add(data: TodoItem): Promise<void> {
    const items = await this.load()

    items.unshift({ uid: uuid.v4(), todo: data })
    await fsWriteFile(this.file, JSON.stringify(items, null, 2))
  }

  public async delete(uid: string): Promise<void> {
    const items = await this.load()
    const idx = items.findIndex(o => o.uid == uid)
    if (idx !== -1) {
      items.splice(idx, 1)
      await fsWriteFile(this.file, JSON.stringify(items, null, 2))
    }
  }

  public async update(uid: string, data: TodoItem): Promise<void> {
    const items = await this.load()
    const idx = items.findIndex(o => o.uid == uid)
    if (idx !== -1) {
      items[idx].todo = data
      await fsWriteFile(this.file, JSON.stringify(items, null, 2))
    }
  }

  public async updateAll(data: TodoItem[]): Promise<void> {
    await fsWriteFile(this.file, '[]')
    for (const t of data) {
      await this.add(t)
    }
  }

  public async dump(data: TodoData[]): Promise<void> {
    await fsWriteFile(this.file, JSON.stringify(data, null, 2))
  }

  public async clear(): Promise<void> {
    await fsWriteFile(this.file, JSON.stringify([], null, 2))
  }
}
