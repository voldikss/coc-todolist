
enum TodoStatus {
  active, // todo
  completed, // done
  cancelled,
}

export interface TodoItem {
  content: string
  status: TodoStatus
  date: string
  due: string
}

export interface TodoItemDB {
  id: string
  content: TodoItem
  path: string
}

