export interface TodoItem {
  topic: string
  date: string
  active: boolean
  due: string
  detail: string
}

export interface TodoData {
  uid: string
  todo: TodoItem
}

export interface Notification {
  title: string
  content: string[]
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
  owner?: {
    login: string
  }
}
