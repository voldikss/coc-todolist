import { statAsync, writeFileAsync, readFileAsync } from './io'
import path from 'path'
import { TodoItem, TodoData } from '../types'
import uuid = require('uuid')

export default class DB {
  private file: string

  constructor(
    directory: string,
    name: string,
    private maxsize: number
  ) {
    this.file = path.join(directory, `${name}.json`)
  }

  public async load(): Promise<TodoData[]> {
    let stat = await statAsync(this.file)
    if (!stat || !stat.isFile()) return []
    let content = await readFileAsync(this.file)
    return JSON.parse(content) as TodoData[]
  }

  public async add(data: TodoItem): Promise<void> {
    let items = await this.load()
    if (items.length == this.maxsize) {
      items.pop()
    }

    items.unshift({ uid: uuid.v4(), todo: data })
    await writeFileAsync(this.file, JSON.stringify(items, null, 2))
  }

  public async delete(uid: string): Promise<void> {
    let items = await this.load()
    let idx = items.findIndex(o => o.uid == uid)
    if (idx !== -1) {
      items.splice(idx, 1)
      await writeFileAsync(this.file, JSON.stringify(items, null, 2))
    }
  }

  public async update(uid: string, data: TodoItem): Promise<void> {
    let items = await this.load()
    let idx = items.findIndex(o => o.uid == uid)
    if (idx !== -1) {
      items[idx].todo = data
      await writeFileAsync(this.file, JSON.stringify(items, null, 2))
    }
  }

  public async updateAll(data: TodoItem[]): Promise<void> {
    await writeFileAsync(this.file, '[]')
    for (const t of data) {
      await this.add(t)
    }
  }

  public async dump(data: TodoData[]): Promise<void> {
    await writeFileAsync(this.file, JSON.stringify(data, null, 2))
  }

  public async clear(): Promise<void> {
    await writeFileAsync(this.file, JSON.stringify([], null, 2))
  }
}
