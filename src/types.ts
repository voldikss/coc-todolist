export type TodoStatus = 'active' | 'archived'

export interface TodoItem {
  desc: string
  date: string
  status: TodoStatus
  remind: boolean
  due: string | null
}

export interface TodoData {
  uid: string
  todo: TodoItem
}

export interface Notification {
  title: string
  content: object
}

export interface GistObject {
  description: string
  public: true | false
  id?: string
  files: {
    'todolist.json': {
      content: string
    }
  }
}
