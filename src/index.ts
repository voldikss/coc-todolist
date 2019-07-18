import {
  commands,
  ExtensionContext,
  listManager,
  workspace
} from 'coc.nvim'
import TodoList from './lists/todolist'
import { mkdirAsync, statAsync } from './util/io'
import DB from './util/db'
import { TodoCommand } from './commands'
import { Alarm } from './alarm'

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

  const AlarmDB = new DB(storagePath, 'alarm', maxsize)
  const alarm = new Alarm(AlarmDB)
  alarm.monitor(config.get<string>('alarm', 'floating'))

  const db = new DB(storagePath, 'todolist', maxsize)
  const todo = new TodoCommand(alarm)

  subscriptions.push(
    commands.registerCommand(
      'todolist.new',
      async () => await todo.new(db)
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.update',
      async () => await todo.update(db)
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.upload',
      async () => await todo.upload(storagePath, db)
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
    workspace.registerAutocmd({
      event: ['BufLeave'], // FIXME: wont work for :qa
      request: true,
      callback: async () => await todo.update(db)
    })
  )

  subscriptions.push(
    listManager.registerList(
      new TodoList(nvim, db)
    )
  )
}
