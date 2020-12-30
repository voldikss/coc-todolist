import { commands, ExtensionContext, listManager, window, workspace } from 'coc.nvim'
import { fsMkdir, fsStat } from './util/fs'
import TodoList from './lists/todolist'
import Todoist from './commands/todoist'
import Guardian from './commands/guardian'
import DB from './util/db'
import Profile from './profile'
import { registerVimInternalEvents } from './events'

export async function activate(context: ExtensionContext): Promise<void> {
  const { subscriptions, storagePath } = context
  const { nvim } = workspace
  const stat = await fsStat(storagePath)
  if (!(stat?.isDirectory())) {
    await fsMkdir(storagePath)
  }

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

  registerVimInternalEvents(context)

  const db = new DB(storagePath, 'todolist')
  const profile = new Profile(storagePath)
  const todo = new Todoist(db, profile)

  const guard = new Guardian(db)
  subscriptions.push(guard)
  if (workspace.getConfiguration('todolist.monitor')) {
    await guard.monitor()
  }

  subscriptions.push(
    commands.registerCommand(
      'todolist.create',
      async () => await todo.create()
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.upload',
      async () => await todo.upload()
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.download',
      async () => await todo.download(storagePath)
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.export',
      async () => await todo.export()
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.clear',
      async () => await todo.clear()
    )
  )

  subscriptions.push(
    commands.registerCommand(
      'todolist.browserOpenGist',
      async () => {
        const userName = await profile.fetch('userName')
        const gistId = await profile.fetch('gistId')
        if (userName && gistId) {
          const url = `https://gist.github.com/${userName}/${gistId}`
          nvim.call('coc#util#open_url', url, true)
        } else {
          window.showMessage('userName or gistId not found', 'error')
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
