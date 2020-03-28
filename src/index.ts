import {
  commands,
  ExtensionContext,
  listManager,
  workspace
} from 'coc.nvim'
import { mkdirAsync, statAsync } from './util/io'
import TodoList from './lists/todolist'
import Todoer from './commands/todoer'
import DB from './util/db'
import Guarder from './commands/guarder'
import TodolistInfo from './util/info'

export async function activate(context: ExtensionContext): Promise<void> {
  const config = workspace.getConfiguration('todolist')
  const enable = config.get<boolean>('enable', true)
  if (!enable) return

  const maxsize = config.get<number>('maxsize', 5000)
  const monitor = config.get<boolean>('monitor', false)
  const autoUpload = config.get<boolean>('autoUpload', false)
  const type = config.get<string>('notify', 'floating')

  const { subscriptions, storagePath } = context
  const { nvim } = workspace

  const stat = await statAsync(storagePath)
  if (!stat || !stat.isDirectory()) {
    await mkdirAsync(storagePath)
  }

  const todoList = new DB(storagePath, 'todolist', maxsize)
  const info = new TodolistInfo(storagePath)
  const todoer = new Todoer(todoList, info)
  const guarder = new Guarder(todoList, type)
  subscriptions.push(guarder)

  if (monitor) await guarder.monitor()
  if (autoUpload) {
    const now = new Date()
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const last = await info.fetch('lastUpload')
    if (last && Number(last) < day.getTime()) {
      workspace.showMessage('uploading')
      await todoer.upload()
    }
  }

  subscriptions.push(
    commands.registerCommand(
      'todolist.create',
      async () => await todoer.create()
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.upload',
      async () => await todoer.upload()
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.download',
      async () => await todoer.download(storagePath)
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.export',
      async () => await todoer.export()
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.clearRemind',
      async () => await guarder.clearNotice()
    )
  )

  subscriptions.push(
    listManager.registerList(
      new TodoList(nvim, todoList)
    )
  )
}
