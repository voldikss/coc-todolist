import { workspace, Uri } from 'coc.nvim'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { todoTemplate } from '../data/template'

export async function newTodo(): Promise<void> {
  await workspace.nvim.command('tab new .todo')

  const { nvim } = workspace
  nvim.pauseNotification()
  nvim.command('set nobuflisted', true)
  nvim.command('set buftype=nowrite', true)
  nvim.call('append', ['0', todoTemplate])
  await nvim.resumeNotification()
}
