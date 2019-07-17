import {
  commands,
  ExtensionContext,
  listManager,
  workspace
} from 'coc.nvim'
import TodoList from './lists/todolist'
import { mkdirAsync, statAsync } from './util/io'
import DB from './util/db'
import { newTodo, downloadTodo, exportTodo, uploadTodo, updateTodo } from './commands'

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
      async () => await newTodo(db)
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.update',
      async () => await updateTodo(db)
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
    workspace.registerAutocmd({
      event: 'BufLeave',
      request: false,
      callback: async () => await updateTodo(db)
    })
  )

  subscriptions.push(
    listManager.registerList(
      new TodoList(nvim, db)
    )
  )
}
