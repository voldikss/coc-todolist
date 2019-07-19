
export type TodoStatus = 'active' | 'completed' | 'cancelled'

export interface TodoItem {
  desc: string
  status: TodoStatus
  date: string
  due: string
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
