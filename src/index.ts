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

  const todoRootPath = config
    .get<string>('root', '~/.coc-todo')
    .replace(/^~/, os.homedir())

  const db = new DB(todoRootPath, config.get<number>('maxsize', 5000))

  subscriptions.push(
    workspace.registerAutocmd({
      event: 'BufEnter',
      request: false,
      callback: detectFileName
    })
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.new',
      async () => await newTodo()
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.register',
      async () => await registerTodo(todoRootPath)
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.upload',
      async () => await uploadTodo(todoRootPath)
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.download',
      async () => await downloadTodo(todoRootPath)
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.export',
      async () => await exportTodo(todoRootPath)
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

async function detectFileName(): Promise<void> {
  const doc = await workspace.document
  if (doc && doc.buffer) {
    const filetype = await doc.buffer.getOption('filetype') as string
    if (filetype && filetype.trim() !== '') {
      return
    }
    const name = await doc.buffer.name
    if (name && /\.todo/i.test(name)) {
      doc.buffer.setOption('filetype', 'todo')
    }
  }
}
