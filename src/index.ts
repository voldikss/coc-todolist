import {
  commands,
  ExtensionContext,
  listManager,
  workspace
} from 'coc.nvim'
import TodoList from './lists/todolist'
import { mkdirAsync, statAsync } from './util/io'
import Todo from './commands/todo'
import DB from './util/db'
import Reminder from './commands/reminder'
import Config from './util/config'

export async function activate(context: ExtensionContext): Promise<void> {
  const config = workspace.getConfiguration('todolist')
  const enable = config.get<boolean>('enable', true)
  if (!enable)
    return

  const maxsize = config.get<number>('maxsize', 5000)
  const monitor = config.get<boolean>('monitor', false)
  const autoUpload = config.get<boolean>('autoUpload', false)

  const { subscriptions, storagePath } = context
  const { nvim } = workspace

  const stat = await statAsync(storagePath)
  if (!stat || !stat.isDirectory()) {
    await mkdirAsync(storagePath)
  }

  const remindList = new DB(storagePath, 'remind', maxsize)
  const reminder = new Reminder(nvim, remindList)

  const db = new DB(storagePath, 'todolist', maxsize)
  const extCfg = new Config(storagePath)
  const todo = new Todo(reminder, extCfg)

  if (monitor) await reminder.monitor()
  if (autoUpload) {
    const now = new Date()
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const last = await extCfg.fetch('lastUpload')
    if (last && Number(last) < day.getTime()) {
      workspace.showMessage('uploading')
      await todo.upload(db)
    }
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
    commands.registerCommand(
      'todolist.clearRemind',
      async () => await reminder.clearNotice()
    )
  )

  subscriptions.push(
    listManager.registerList(
      new TodoList(nvim, db)
    )
  )
}
