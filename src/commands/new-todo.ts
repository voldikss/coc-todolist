import { workspace, Uri } from 'coc.nvim'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { todoTemplate } from '../data/template'

export async function newTodo(): Promise<void> {
  const { nvim } = workspace
  nvim.pauseNotification()
  await workspace.nvim.command('tab new .todo')
  await nvim.command('set filetype=todo')
  await nvim.command('set syntax=yaml')
  nvim.command('set nobuflisted', true)
  nvim.command('set buftype=nowrite', true)
  nvim.call('append', ['0', todoTemplate], true)
  nvim.command('normal gg$', true)
  await nvim.resumeNotification()
}
