
export type TodoStatus = 'active' | 'completed'

export interface TodoItem {
  desc: string
  date: string
  status?: TodoStatus
  due?: string
}

export interface TodoItemDB {
  id: string
  content: TodoItem
  path: string
}

export interface Notification {
  title: string
  content: object
}
