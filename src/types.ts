
export interface TodoItem {
  Title: string
  Created_At: string
  Status: string
  Alarm?: boolean
  Alarm_At?: string
  Tags?: string[]
  Content?: string[]
}

export interface TodoItemDB {
  id: string
  content: TodoItem
  path: string
}

