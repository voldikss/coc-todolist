import { TodoItem } from "../types"
import { workspace, window } from "coc.nvim"
import DB from "./db"
import { bufWriteCmdListener } from "../events"
import moment from "moment-timezone"

const dateFormat = workspace.getConfiguration('todolist').get<string>('dateFormat')

let todolistUpdated = false
let bufChanged = false

export function createTodo(): TodoItem {
  const date = new Date().toString()
  return {
    topic: '',
    date: date,
    active: true,
    due: date,
    detail: ''
  } as TodoItem
}

export function parseTodo(text: string): TodoItem {
  const lines = text.trim().split('\n')
  const todo = createTodo()
  let flag
  for (const line of lines.slice(3)) {
    if (/^\s*$/.test(line)) {
      continue
    } else if (/─TOPIC─/.test(line)) {
      flag = 'topic'
    } else if (/─DETAIL─/.test(line)) {
      flag = 'detail'
    } else if (/─DATE─/.test(line)) {
      flag = 'date'
    } else if (/─DUE─/.test(line)) {
      flag = 'due'
    } else if (/─ACTIVE─/.test(line)) {
      flag = 'active'
    } else {
      if (flag == 'topic' || flag == 'detail') {
        todo[flag] += line.trim()
      } else if (flag == 'date' || flag == 'due') {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        todo[flag] = moment(line.trim(), dateFormat).tz(timezone).toDate().toString()
      } else {
        todo[flag] = line.trim() == 'true'
      }
    }
  }
  return todo
}

export function drawTodo(todo: TodoItem, width: number): string[] {
  const drawBar = (title: string, width: number) => {
    return ('─'.repeat((width - title.length) / 2) + title).padEnd(width, '─')
  }
  const res = []
  res.push(`Save current buffer to create/update todolist`)
  res.push(`Notice that this buffer will be closed after saving`)
  res.push('')
  res.push(drawBar('ACTIVE', width))
  res.push(todo.active)
  res.push(drawBar('DATE', width))
  res.push(moment(todo.date).format(dateFormat))
  res.push(drawBar('DUE', width))
  res.push(moment(todo.due).format(dateFormat))
  res.push(drawBar('TOPIC', width))
  res.push(todo.topic)
  res.push(drawBar('DETAIL', width))
  res.push(...todo.detail.trim().split('\n'))
  return res
}

export function checkTodo(todo: TodoItem): boolean {
  if (todo.topic.trim() == '') {
    window.showMessage('TOPIC can not be empty', 'error')
    return false
  }
  if (todo.date.toString() == 'NaN') {
    window.showMessage('error on DATE format', 'error')
    return false
  }
  if (todo.due.toString() == 'NaN') {
    window.showMessage('error on DUE format', 'error')
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
  nvim.pauseNotification()
  nvim.command(`vs __coc_todolist__`, true)
  nvim.command(`setl filetype=coc_todolist buftype=acwrite nobuflisted bufhidden=wipe nofen wrap`, true)
  nvim.command(`setl undolevels=1000 nolist nospell noswapfile nomod conceallevel=2 concealcursor=n`, true)
  nvim.command('setl nomod nonumber norelativenumber signcolumn=yes:1', true)
  await nvim.resumeNotification()

  const [bufnr, width] = await nvim.call('coc_todolist#get_buf_info') as [number, number]
  const lines = drawTodo(todo, width)
  await nvim.call('append', [0, lines])
  await nvim.command('normal! Gdd')
  await nvim.call('search', ['TOPIC', 'b'])
  await nvim.command('normal! j')
  await nvim.command('normal! I')
  todolistUpdated = false

  bufWriteCmdListener.on(async () => {
    if (todolistUpdated) {
      window.showMessage('Todo item already added', 'warning')
      return
    }
    if (!bufChanged) {
      window.showMessage('No changes', 'warning')
      return
    }
    const document = workspace.getDocument(bufnr)
    if (document) {
      const lines = document.content
      const todo = parseTodo(lines)
      if (checkTodo(todo)) {
        if (action == 'create') {
          await db.add(todo)
          window.showMessage('New todo added')
        } else {
          await db.update(uid, todo)
          window.showMessage('Todo item updated')
        }
        todolistUpdated = true
        nvim.command('close!')
      }
    }
  })
  workspace.onDidChangeTextDocument(() => {
    bufChanged = true
    todolistUpdated = false
  })
}
