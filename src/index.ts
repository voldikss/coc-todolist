import {
  commands,
  ExtensionContext,
  languages,
  listManager,
  workspace
} from 'coc.nvim'
import os from 'os'
import { newTodo } from './commands/new-todo'
import TodoList from './lists/todolist'
import { completionProvider } from './provider/completion'
import { mkdirAsync, statAsync } from './util/io'
import { uploadTodo } from './commands/upload-todo'
import { downloadTodo } from './commands/download-todo'
import { exportTodo } from './commands/export-todo'
import { registerTodo } from './commands/register-todo'
import DB from './util/db'

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
      async () => await uploadTodo(storagePath)
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.download',
      async () => await downloadTodo(storagePath)
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.export',
      async () => await exportTodo(storagePath)
    )
  )

  subscriptions.push(
    listManager.registerList(
      new TodoList(nvim, storagePath, db)
    )
  )

  subscriptions.push(
    languages.registerCompletionItemProvider(
      'todo',
      'todo',
      ['todo'],
      completionProvider,
      [],
      99
    )
  )
}
