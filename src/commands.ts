import { workspace, Uri } from 'coc.nvim'
import yaml from 'js-yaml'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { TodoItem } from './types'
import DB from './util/db'

export async function newTodo(): Promise<void> {
  const { nvim } = workspace
  nvim.pauseNotification()
  await workspace.nvim.command('tab new .todo')
  await nvim.command('set filetype=todo')
  await nvim.command('set syntax=yaml')
  nvim.command('set nobuflisted', true)
  nvim.command('set buftype=nowrite', true)
  nvim.command('normal gg$', true)
  await nvim.resumeNotification()
}

export async function registerTodo(storagePath: string): Promise<void> {
  const document = await workspace.document

  let text: string
  if (document && document.textDocument) {
    text = document.textDocument.getText()
    if (!text)
      return
  }
  const obj: TodoItem = yaml.safeLoad(text)
  // const obj: TodoItem = {
  //   title: obj['Title'],
  //   created_at: obj['Create_At'],
  //   status: obj['Status'],
  //   alarm: obj['Alarm'] || null,
  //   alarm_at: obj['Alarm_At'] || null,
  //   tags: obj['Tags'] || null,
  //   content: obj['Content'] || null
  // }

  workspace.showMessage(JSON.stringify(obj))
  // TODO: improve
  if (!('Title' in obj && 'Create_At' in obj && 'Status' in obj)) {
    workspace.showMessage('Invalid todolist content')
    return
  }

  const config = workspace.getConfiguration('todolist')
  const maxsize = config.get<number>('maxsize', 5000)

  workspace.showMessage(JSON.stringify(obj))

  const db = new DB(storagePath, maxsize)
  db.add(obj)
}

export async function downloadTodo(): Promise<void> {
  //
}
export async function uploadTodo(): Promise<void> {
  //
}
export async function exportTodo(): Promise<void> {
  //
}
