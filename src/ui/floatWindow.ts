import { FloatOptions } from '@chemzqm/neovim/lib/api/types'
import { Buffer } from '@chemzqm/neovim/lib/api/Buffer'
import { Window, Neovim, workspace, WorkspaceConfiguration } from 'coc.nvim'
import { Notification } from '../types'
import Highlighter from 'coc.nvim/lib/model/highligher'

export default class FloatWindow {
  private window: Window = null
  private windows: Window[] = []
  private config: WorkspaceConfiguration
  private tempWins: Window[] = []
  private width = 30
  private height = 4

  constructor(private nvim: Neovim) {
    this.config = workspace.getConfiguration('todolist.floatwin')
    workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('todolist.floatwin')) {
        this.config = workspace.getConfiguration('todolist.floatwin')
      }
    })
    this.width = this.config.get<number>('width', 30)
  }

  private async getWinConfig(): Promise<FloatOptions> {
    const height = await this.nvim.getOption('lines')
    const width = await this.nvim.getOption('columns')

    const winConfig: FloatOptions = {
      focusable: false,
      relative: 'editor',
      anchor: 'NW',
      height: this.height,
      width: this.width,
      row: Number(height) + 1,
      col: Number(width) - this.width,
    }

    return winConfig
  }

  private async render(notice: Notification): Promise<Highlighter> {
    const hl = new Highlighter()
    const margin = ' '.repeat(Math.floor((this.width - notice.title.length) / 2))
    hl.addLine(`${margin}${notice.title}`, 'Title')
    for (const detail of notice.content) {
      hl.addLine('* ')
      hl.addText(detail, 'String')
    }
    return hl
  }

  private async moveUp(windows: Window[]): Promise<void> {
    await Promise.all(windows.map(async w => {
      const isValid = await w.valid
      if (isValid) {
        const winConfig = await w.getConfig()
        for (let i = 0; i <= this.height; i++) {
          winConfig.row -= 1
          await w.setConfig(winConfig)
          await new Promise(resolve => setTimeout(resolve, 30))
        }
      }
    }))
  }

  /**
   * keep windows count when there are over one notifications
   */
  private async noMoreWins(): Promise<void> {
    const winblend = this.config.get<number>('winblend', 0)

    // only one window preserved
    if (this.windows.length > 1) {
      const discard = this.windows.shift()
      this.tempWins.push(discard)
      setImmediate(async () => {
        for (let i = winblend; i <= 100; i++) {
          await discard.setOption('winblend', i)
          await new Promise(
            resolve => setTimeout(resolve, 500 / (100 - winblend))
          )
        }
        await discard.close(true)
        this.tempWins.shift()
      })
    }
  }

  private async create(buf: Buffer): Promise<void> {
    const winConfig = await this.getWinConfig()
    this.window = await this.nvim.openFloatWindow(buf, false, winConfig)
    this.windows.push(this.window)

    const { window, nvim } = this

    nvim.pauseNotification()
    const winblend = this.config.get<number>('winblend', 0)
    const floatwinBg = this.config.get<string>('background')
    if (floatwinBg) {
      nvim.command(`hi TodoGuarder guibg=${floatwinBg}`, true)
    } else {
      nvim.command(`hi def link TodoGuarder NormalFloat`, true)
    }
    window.setOption('winhighlight', 'NormalFloat:TodoGuarder,Normal:TodoGuarder,FoldColumn:TodoGuarder', true)
    window.setOption('number', false, true)
    window.setOption('relativenumber', false, true)
    window.setOption('cursorline', false, true)
    window.setOption('signcolumn', 'no', true)
    window.setOption('foldcolumn', 1, true)
    window.setOption('winblend', winblend, true)
    await nvim.resumeNotification()

    await this.moveUp(this.windows.concat(this.tempWins))

    await this.noMoreWins()
  }

  public async start(notice: Notification): Promise<void> {
    const buf = await this.nvim.createNewBuffer()
    buf.setOption('bufhidden', 'wipe', true)
    buf.setOption('buftype', 'nowrite', true)

    const renderer = await this.render(notice)
    // buffer was changed here
    renderer.render(buf)
    await this.create(buf)
  }

  public async destroy(): Promise<void> {
    for (const w of this.windows.concat(this.tempWins)) {
      const isValid = await w.valid
      if (isValid) await w.close(true)
    }
  }
}
