import { TodoItem } from "../types"
import { workspace, events } from "coc.nvim"
import DB from "./db"

let alreadyAdded = false
let bufChanged = false

export function newTodo(): TodoItem {
  return {
    topic: '',
    date: new Date().toString(),
    active: true,
    due: '',
    description: ''
  } as TodoItem
}

export function parseTodo(text: string): TodoItem {
  const lines = text.split('\n')
  const todo = newTodo()
  for (const line of lines) {
    if (/__TOPIC__/.test(line)) {
      todo.topic = line.substr(13).trim()
    } else if (/__DATE__/.test(line)) {
      todo.date = line.substr(13).trim()
    } else if (/__ACTIVE__/.test(line)) {
      todo.active = line.substr(13).trim() == 'true'
    } else if (/__DUE__/.test(line)) {
      todo.due = line.substr(13).trim()
    } else if (/__DESCRIPTION__/.test(line)) {
      todo.description = ''
    } else if (!(/───────/.test(line)) && line.trim().length > 0) {
      todo.description += line + '\n'
    }
  }
  return todo
}

export function drawTodo(todo: TodoItem, width: number): string[] {
  const res = []
  const com = `─────────────${'─'.repeat(width - 19)}`
  const top = `────────────┬${'─'.repeat(width - 19)}`
  const cen = `────────────┼${'─'.repeat(width - 19)}`
  const bot = `────────────┴${'─'.repeat(width - 19)}`
  res.push(`Save current buffer to create/update todolist`)
  res.push(``)
  res.push(top)
  res.push(` __TOPIC__  │ ${todo.topic}`)
  res.push(cen)
  res.push(` __DATE__   │ ${todo.date}`)
  res.push(cen)
  res.push(` __ACTIVE__ │ ${todo.active}`)
  res.push(cen)
  res.push(` __DUE__    │ ${todo.due}`)
  res.push(bot)
  res.push(` __DESCRIPTION__`)
  res.push(com)
  res.push(``)
  res.push(com)
  return res
}

export function isValid(todo: TodoItem): boolean {
  if (todo.topic.trim() == '') {
    workspace.showMessage('topic can not be empty', 'error')
    return false
  }
  if (Date.parse(todo.date).toString() == 'NaN') {
    workspace.showMessage('error date format', 'error')
    return false
  }
  return true
}

export async function createTodoEditBuffer(
  todo: TodoItem,
  db: DB,
  action: 'create' | 'update',
  uid?: string
): Promise<void> {
  const { nvim } = workspace
  await nvim.command('runtime plugin/coc_todolist.vim')
  const openCommand = workspace.getConfiguration('refactor').get('openCommand') as string
  nvim.pauseNotification()
  nvim.command(`${openCommand} __coc_todolist__`, true)
  nvim.command(`setl filetype=coc_todolist buftype=acwrite nobuflisted bufhidden=wipe nofen wrap`, true)
  nvim.command(`setl undolevels=1000 nolist nospell noswapfile nomod conceallevel=2 concealcursor=n`, true)
  nvim.command('setl nomod', true)
  const [, err] = await nvim.resumeNotification()
  if (err) {
    logger.error(err)
    workspace.showMessage(`Error on open todoedit window: ${err}`, 'error')
    return
  }
  const [bufnr, width] = await nvim.eval('[bufnr("%"), winwidth(0)]') as [number, number]
  const lines = drawTodo(todo, width)
  await nvim.call('append', [0, lines])
  await nvim.command('normal! Gdd')
  await nvim.call('cursor', [4, 0])
  await nvim.command('normal! A')
  alreadyAdded = false

  events.on('BufWriteCmd', async () => {
    if (alreadyAdded) {
      workspace.showMessage('Todo item already added', 'warning')
      return
    }
    if (!bufChanged) {
      workspace.showMessage('No changes', 'warning')
      return
    }
    const document = workspace.getDocument(bufnr)
    if (document) {
      const lines = document.content
      const todo = parseTodo(lines)
      if (this.isValid(todo)) {
        if (action == 'create') {
          await db.add(todo)
          workspace.showMessage('New todo added')
        } else {
          await db.update(uid, todo)
          workspace.showMessage('Todo item updated')
        }
        alreadyAdded = true
      }
    }
  })
  workspace.onDidChangeTextDocument(() => {
    bufChanged = true
  })
}
