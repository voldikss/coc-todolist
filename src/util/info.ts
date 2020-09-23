import { fsReadFile, fsStat, fsWriteFile } from './fs'
import fs from 'fs'
import path from 'path'

export default class TodolistInfo {
  private file: string
  constructor(directory: string) {
    this.file = path.join(directory, 'config.json')
  }

  public async load(): Promise<object> {
    let stat = await fsStat(this.file)
    if (!stat || !stat.isFile()) {
      await fsWriteFile(this.file, '{}')
      return {}
    }

    try {
      let content = await fsReadFile(this.file)
      return JSON.parse(content)
    } catch (e) {
      await fsWriteFile(this.file, '{}')
      return {}
    }
  }

  public async fetch(key: string): Promise<any> {
    let obj = await this.load()
    if (typeof obj[key] == 'undefined') {
      return undefined
    }
    return obj[key]
  }

  public async exists(key: string): Promise<boolean> {
    let obj = await this.load()
    if (typeof obj[key] == 'undefined') {
      return false
    }
    return true
  }

  public async delete(key: string): Promise<void> {
    let obj = await this.load()
    if (typeof obj[key] == 'undefined') {
      return
    }
    delete obj[key]
    await fsWriteFile(this.file, JSON.stringify(obj, null, 2))
  }

  public async push(key: string, data: number | null | boolean | string): Promise<void> {
    let obj = await this.load()
    obj[key] = data
    await fsWriteFile(this.file, JSON.stringify(obj, null, 2))
  }

  public async clear(): Promise<void> {
    let stat = await fsStat(this.file)
    if (!stat || !stat.isFile()) return
    await fsWriteFile(this.file, '{}')
  }

  public destroy(): void {
    if (fs.existsSync(this.file)) {
      fs.unlinkSync(this.file)
    }
  }
}
