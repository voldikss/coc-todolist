import {
  commands,
  ExtensionContext,
  languages,
  listManager,
  workspace
} from 'coc.nvim'
import os from 'os'
import TodoList from './lists/todolist'
import { mkdirAsync, statAsync } from './util/io'
import DB from './util/db'
import { newTodo, registerTodo, downloadTodo, exportTodo, uploadTodo } from './commands'

export async function activate(context: ExtensionContext): Promise<void> {
  const { subscriptions, storagePath } = context
  const { nvim } = workspace

  const stat = await statAsync(storagePath)
  if (!stat || !stat.isDirectory()) {
    await mkdirAsync(storagePath)
  }
  const config = workspace.getConfiguration('todolist')

  const db = new DB(storagePath, config.get<number>('maxsize', 5000))

  subscriptions.push(
    commands.registerCommand(
      'todolist.new',
      async () => await newTodo()
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.register',
      async () => await registerTodo(storagePath)
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.upload',
      async () => await uploadTodo()
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.download',
      async () => await downloadTodo()
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.export',
      async () => await exportTodo()
    )
  )

  subscriptions.push(
    listManager.registerList(
      new TodoList(nvim, storagePath, db)
    )
  )
}
