import {
  commands,
  ExtensionContext,
  listManager,
  workspace
} from 'coc.nvim'
import TodoList from './lists/todolist'
import { mkdirAsync, statAsync } from './util/io'
import Todo from './commands'
import DB from './util/db'
import Reminder from './reminder'
import Config from './util/config'

export async function activate(context: ExtensionContext): Promise<void> {
  const config = workspace.getConfiguration('todolist')
  const enable = config.get<boolean>('enable', true)
  if (!enable)
    return

  const { subscriptions, storagePath } = context
  const { nvim } = workspace

  const stat = await statAsync(storagePath)
  if (!stat || !stat.isDirectory()) {
    await mkdirAsync(storagePath)
  }

  const maxsize = config.get<number>('maxsize', 5000)

  const RemindDB = new DB(storagePath, 'remind', maxsize)
  const reminder = new Reminder(nvim, RemindDB, config)
  await reminder.monitor(config.get<string>('remind', 'floating'))

  const db = new DB(storagePath, 'todolist', maxsize)
  const extCfg = new Config(storagePath)
  /// test///////////
  // await extCfg.push('gist-id', 'ddd')
  // await extCfg.push('userToken', 'token')
  // const userToken = await extCfg.fetch('userToken')
  // workspace.showMessage(userToken)
  /////////////////

  const todo = new Todo(reminder, extCfg)

  const autoUpload = config.get<boolean>('autoUpload', false)
  if (autoUpload) {
    const now = new Date()
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const last = extCfg.fetch('lastUpload')
    if (last && Number(last) > day.getTime())
      await todo.upload(db)
  }

  subscriptions.push(
    commands.registerCommand(
      'todolist.create',
      async () => await todo.create(db)
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.upload',
      async () => await todo.upload(db)
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.download',
      async () => await todo.download(storagePath, db)
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.export',
      async () => await todo.export(db)
    )
  )

  subscriptions.push(
    listManager.registerList(
      new TodoList(nvim, db)
    )
  )
}
