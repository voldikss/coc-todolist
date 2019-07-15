export interface TodoIdentifier {
  name: string
  values: string[]
  document: string[]
}

export const todoIdentifiers: Record<string, TodoIdentifier> = {
  Title: {
    name: 'Title',
    values: [],
    document: [
      '`Title` of todo',
      '',
      '*example*',
      '',
      'no example'
    ]
  },
  Deadline: {
    name: 'Deadline',
    values: [],
    document: [
      '`Deadline` of todo item'
    ]
  },
  Alarm: {
    name: 'Alarm',
    values: ['true'],
    document: [
      'whether to reminder'
    ]
  },
  Content: {
    name: 'Content',
    values: [],
    document: [
      'content of todo',
      '',
      'details'
    ]
  }
}
