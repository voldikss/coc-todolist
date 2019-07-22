
export type TodoStatus = 'active' | 'completed'

export interface TodoItem {
  desc: string
  date: string
  status?: TodoStatus
  due?: string
}

export interface TodoItemDB {
  id: string
  todo: TodoItem
}

export interface Notification {
  title: string
  content: object
}
