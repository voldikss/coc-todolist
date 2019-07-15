import { workspace, Uri } from 'coc.nvim'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

export const newTodo = async (todoRootPath: string) => {
  if (!existsSync(todoRootPath)) {
    mkdirSync(todoRootPath)
  }
  const name = await workspace.requestInput('New todo name')
  if (name && name.trim() !== '') {
    const todoPath = join(todoRootPath, `${name}.todo`)
    workspace.openResource(Uri.file(todoPath).toString())
  }
}
