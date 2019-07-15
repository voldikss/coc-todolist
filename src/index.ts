import { commands, ExtensionContext, languages, listManager, workspace } from 'coc.nvim'
import os from 'os'
import { newTodo } from './commands/new-todo'
import TodoList from './lists/todolist'
import { completionProvider } from './provider/completion'
import { mkdirAsync, statAsync } from './util'

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

export async function activate(context: ExtensionContext): Promise<void> {
  const { subscriptions, storagePath } = context
  const { nvim } = workspace
  const stat = await statAsync(storagePath)
  if (!stat || !stat.isDirectory()) {
    await mkdirAsync(storagePath)
  }
  const config = workspace.getConfiguration('todolist')

  const isDetect = config.get<boolean>('detect', true)
  const todoRootPath = config.get<string>('root', '~/.coc-todo').replace(/^~/, os.homedir())

  if (isDetect) {
    context.subscriptions.push(
      workspace.registerAutocmd({
        event: 'BufEnter',
        request: false,
        callback: detectFileName
      })
    )
  }

  subscriptions.push(workspace.registerKeymap(['n'], 'todolist-new', async () => {
    //
  }, { sync: false }))

  subscriptions.push(workspace.registerKeymap(['n'], 'todolist-upload', async () => {
    //
  }, { sync: false }))

  subscriptions.push(workspace.registerKeymap(['n'], 'todolist-download', async () => {
    //
  }, { sync: false }))

  subscriptions.push(workspace.registerKeymap(['n'], 'todolist-export', async () => {
    //
  }, { sync: false }))

  subscriptions.push(commands.registerCommand('todolist.new', () => {
    newTodo(todoRootPath)
  }))

  subscriptions.push(commands.registerCommand('todolist.upload', async () => {
    //
  }))

  subscriptions.push(commands.registerCommand('todolist.download', async () => {
    //
  }))

  subscriptions.push(commands.registerCommand('todolist.export', async () => {
    //
  }))

  subscriptions.push(listManager.registerList(new TodoList(todoRootPath)))

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
