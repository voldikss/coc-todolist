import { fsReadFile, fsStat, fsWriteFile } from './util/fs'
import fs from 'fs'
import path from 'path'

export default class Profile {
  private file: string
  constructor(directory: string) {
    this.file = path.join(directory, 'config.json')
  }

  public async load(): Promise<Record<string, any>> {
    const stat = await fsStat(this.file)
    if (!(stat?.isFile())) {
      await fsWriteFile(this.file, '{}')
      return {}
    }

    try {
      const content = await fsReadFile(this.file)
      return JSON.parse(content)
    } catch (e) {
      await fsWriteFile(this.file, '{}')
      return {}
    }
  }

  public async fetch(key: string): Promise<any> {
    const obj = await this.load()
    if (typeof obj[key] == 'undefined') {
      return undefined
    }
    return obj[key]
  }

  public async exists(key: string): Promise<boolean> {
    const obj = await this.load()
    if (typeof obj[key] == 'undefined') {
      return false
    }
    return true
  }

  public async delete(key: string): Promise<void> {
    const obj = await this.load()
    if (typeof obj[key] == 'undefined') {
      return
    }
    delete obj[key]
    await fsWriteFile(this.file, JSON.stringify(obj, null, 2))
  }

  public async push(key: string, data: number | null | boolean | string): Promise<void> {
    const obj = await this.load()
    obj[key] = data
    await fsWriteFile(this.file, JSON.stringify(obj, null, 2))
  }

  public async clear(): Promise<void> {
    const stat = await fsStat(this.file)
    if (!(stat?.isFile())) return
    await fsWriteFile(this.file, '{}')
  }

  public destroy(): void {
    if (fs.existsSync(this.file)) {
      fs.unlinkSync(this.file)
    }
  }
}
