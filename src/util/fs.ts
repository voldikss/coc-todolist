import { promises as fsPromises } from 'fs'

export const fsStat = fsPromises.stat
export const fsWriteFile = fsPromises.writeFile
export const fsReadFile = filename => fsPromises.readFile(filename, { encoding: 'utf-8' })
export const fsMkdir = fsPromises.mkdir
