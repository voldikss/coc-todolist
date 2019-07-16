
export interface TodoItem {
  title: string
  created_at: string
  alarm_at: string
  status: string
  alarm?: boolean
  tags?: string[]
  content?: string[]
}

export interface TodoItemDB {
  id: string
  content: TodoItem
  path: string
}

