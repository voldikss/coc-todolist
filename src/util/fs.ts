import fs from 'fs'

export async function fsStat(filepath: string): Promise<fs.Stats | null> {
  return new Promise(resolve => {
    fs.stat(filepath, (err, stats) => {
      if (err) resolve(null)
      resolve(stats)
    })
  })
}

export async function fsWriteFile(fullpath: string, content: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(fullpath, content, 'utf8', err => {
      if (err) reject()
      resolve()
    })
  })
}

export function fsReadFile(fullpath: string, encoding = 'utf8'): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(fullpath, encoding, (err, content) => {
      if (err) reject(err)
      resolve(content)
    })
  })
}

export function fsMkdir(filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdir(filepath, err => {
      if (err) reject(err)
      resolve()
    })
  })
}
