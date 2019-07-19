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
import Config from './util/config'

export async function activate(context: ExtensionContext): Promise<void> {
  const userCfg = workspace.getConfiguration('todolist')
  const enable = userCfg.get<boolean>('enable', true)
  if (!enable)
    return

  const { subscriptions, storagePath } = context
  const { nvim } = workspace

  const stat = await statAsync(storagePath)
  if (!stat || !stat.isDirectory()) {
    await mkdirAsync(storagePath)
  }

  const maxsize = userCfg.get<number>('maxsize', 5000)

  const AlarmDB = new DB(storagePath, 'alarm', maxsize)
  const alarm = new Alarm(AlarmDB)
  await alarm.monitor(userCfg.get<string>('alarm', 'floating'))

  const db = new DB(storagePath, 'todolist', maxsize)
  const extCfg = new Config(storagePath)
  /// test///////////
  // await extCfg.push('gist-id', 'ddd')
  // await extCfg.push('userToken', 'token')
  // const userToken = await extCfg.fetch('userToken')
  // workspace.showMessage(userToken)
  /////////////////

  const todo = new TodoCommand(alarm, extCfg)

  const autoUpload = userCfg.get<boolean>('autoUpload', false)
  if (autoUpload) {
    const now = new Date()
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const last = extCfg.fetch('lastUpload')
    if (last && Number(last) > day.getTime())
      await todo.upload(db)
  }

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
