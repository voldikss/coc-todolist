import { workspace } from 'coc.nvim'
import { TodoItem } from '../types'
import yaml from 'js-yaml'
import uuid = require('uuid/v1')
import DB from '../util/db'

export async function registerTodo(todoRootPath: string): Promise<void> {
  const document = await workspace.document

  let text: string
  if (document && document.textDocument) {
    text = document.textDocument.getText()
    if (!text)
      return
  }
  const obj = yaml.safeLoad(text)
  const todo: TodoItem = {
    title: obj['Title'],
    created_at: obj['Create_At'],
    status: obj['Status'],
    alarm: obj['Alarm'] || null,
    alarm_at: obj['Alarm_At'] || null,
    tags: obj['Tags'] || null,
    content: obj['Content'] || null
  }

  workspace.showMessage(JSON.stringify(todo))
  if (!(todo.title && todo.created_at && todo.status)) {
    workspace.showMessage('Invalid todolist content')
    return
  }

  const config = workspace.getConfiguration('todolist')
  const maxsize = config.get<number>('maxsize', 5000)

  workspace.showMessage(JSON.stringify(todo))

  const db = new DB(todoRootPath, maxsize)
  db.add(todo)

  // const {nvim} = workspace
  // const db = new DB(todoRootPath, )
  // db.add(todo)

  // const lines = text.trim().split('\n')
  // const todoItem = {}
  // for (const i of Object.keys(lines)) {
  //   const line = lines[i]
  //   workspace.showMessage(line)
  //   if (line.trim() === '')
  //     continue
  // }
}
