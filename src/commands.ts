import { workspace } from 'coc.nvim'
import { TodoItem, TodoStatus } from './types'
import DB from './util/db'

export async function newTodo(db: DB): Promise<void> {
  let desc: string
  let date: string
  let status: TodoStatus
  let due: string | null

  desc = await workspace.requestInput('Describe todo content')
  if (!desc || desc.trim() === '')
    return

  desc = desc.trim()
  date = await workspace.nvim.call('strftime', '%Y-%m-%d %T')
  status = 'active'

  due = await workspace.requestInput('Enter due date')
  if (due && due.trim() !== '')
    due = due.trim()

  const todo: TodoItem = { desc, status, date, due }
  db.add(todo)

  workspace.showMessage("new todo added")
}

export async function updateTodo(db: DB): Promise<void> {
  const doc = await workspace.document
  const filetype = await doc.buffer.getOption('filetype')
  if (!(filetype && filetype === 'todo'))
    return

  let text: string
  if (doc && doc.textDocument) {
    text = doc.textDocument.getText()
    if (!text)
      return
  }

  // TODO: check invalid
  const todo = {} as TodoItem
  const lines = text.trim().split('\n')
  for (const i of Object.keys(lines)) {
    let line = lines[i]
    let [key, value] = line.split(':')
    todo[key] = value
  }

  // TODO
  db.add(todo)

  workspace.showMessage("todo updated")
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
