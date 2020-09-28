import {
  commands,
  ExtensionContext,
  listManager,
  workspace
} from 'coc.nvim'
import { fsMkdir, fsStat } from './util/fs'
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

  const stat = await fsStat(storagePath)
  if (!(stat?.isDirectory())) {
    await fsMkdir(storagePath)
  }

  const db = new DB(storagePath, 'todolist', maxsize)
  const info = new TodolistInfo(storagePath)
  const todoer = new Todoer(db, info)
  const guarder = new Guarder(db, type)
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

  // thank to weirongxu/coc-explorer
  (async () => {
    const rtp = (await nvim.getOption('runtimepath')) as string
    const paths = rtp.split(',')
    if (!paths.includes(context.extensionPath)) {
      await nvim.command(
        `execute 'noa set rtp^='.fnameescape('${context.extensionPath.replace(
          /'/g,
          "''",
        )}')`,
      )
    }
  })().catch(_e => { })

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
      'todolist.clear',
      async () => await todoer.clear()
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.closeNotice',
      async () => await guarder.closeNotice()
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.browserOpenGist',
      async () => {
        const userName = await info.fetch('userName')
        const gistId = await info.fetch('gistId')
        if (userName && gistId) {
          const url = `https://gist.github.com/${userName}/${gistId}`
          nvim.call('coc#util#open_url', url, true)
        } else {
          workspace.showMessage('userName or gistId not found', 'error')
        }
      }
    )
  )

  subscriptions.push(
    listManager.registerList(
      new TodoList(nvim, db)
    )
  )
}
