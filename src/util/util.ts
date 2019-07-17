import { TodoItem } from '../types'

// TODO: must be improve
export function JSON2YAML(todo: TodoItem): string[] {
  const yaml: string[] = []
  yaml.push(`Title: ${todo.Title}`)
  yaml.push(`Created_At: ${todo.Created_At}`)
  yaml.push(`Status: ${todo.Status}`)
  if ('Alarm' in todo) {
    yaml.push(`Alarm: ${todo.Alarm}`)
    yaml.push(`Alarm_At: ${todo.Alarm_At}`)
  }

  if ('Tags' in todo) {
    yaml.push('')
    yaml.push('Tags:')
    for (let i of todo.Tags) {
      if (i)
        yaml.push(`  - ${i}`)
    }
  }

  if ('Content' in todo) {
    yaml.push('')
    yaml.push('Content:')
    for (let i of todo.Content) {
      if (i)
        yaml.push(`  - ${i}`)
    }

  }
  return yaml
}
