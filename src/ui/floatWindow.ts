import { FloatOptions } from '@chemzqm/neovim/lib/api/types'
import { Buffer } from '@chemzqm/neovim/lib/api/Buffer'
import { Window, Neovim, WorkspaceConfiguration } from 'coc.nvim'
import { Notification } from '../types'
import Highlighter from 'coc.nvim/lib/model/highligher'

export default class FloatWindow {
  private window: Window = null
  private windows: Window[] = []
  private tmpWindows: Window[] = []
  private width = 30
  private height = 4

  constructor(private nvim: Neovim, private config: WorkspaceConfiguration) {
    this.width = this.config.get<number>('width', 30)
  }

  private async getWinConfig(): Promise<FloatOptions> {
    const height = await this.nvim.eval('winheight(0)')
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
    const margin = ' '.repeat(Math.floor((this.width - notice.title.length) / 2)) // TODO
    hl.addLine(`${margin}${notice.title}`, 'Title')
    for (const [item, detail] of Object.entries(notice.content)) {
      hl.addLine(item, 'Keyword')
      hl.addText(': ')
      hl.addText(detail, 'String')
    }

    return hl
  }

  private async moveUp(windows: Window[]): Promise<void> {
    await Promise.all(windows.map(async w => {
      const isValid = await w.valid
      if (isValid) {
        const winCfg = await w.getConfig()
        for (let i = 0; i <= 4; i++) {
          winCfg.row -= 1
          await w.setConfig(winCfg)
          await new Promise(resolve => setTimeout(resolve, 30))
        }
      }
    }))
  }

  private async create(buf: Buffer): Promise<void> {
    const winConfig = await this.getWinConfig()
    this.window = await this.nvim.openFloatWindow(buf, false, winConfig)
    this.windows.push(this.window)

    const winblend = this.config.get<number>('winblend', 0)

    this.nvim.pauseNotification()
    const floatBg = this.config.get<string>('background')
    if (floatBg) {
      this.nvim.command(`hi TodoReminder guibg=${floatBg}`, true)
      this.nvim.command(`hi FoldColumn guibg=${floatBg}`, true) // XXX
    }
    this.window.setOption('number', false, true)
    this.window.setOption('relativenumber', false, true)
    this.window.setOption('cursorline', false, true)
    this.window.setOption('signcolumn', 'no', true)
    this.window.setOption('foldcolumn', 1, true)
    this.window.setOption('winblend', winblend, true)
    this.window.setOption('winhighlight', 'Normal:TodoReminder', true)
    await this.nvim.resumeNotification()

    await this.moveUp(this.windows)

    await this.keepWindowCounts()
  }

  /**
   * keep windows count when there are over one notifications
   */
  private async keepWindowCounts(): Promise<void> {
    // const winblend = this.config.get<number>('winblend', 0)
    const winblend = 0

    // 2 can be specified by humans
    if (this.windows.length > 2) {
      let discardWin = this.windows.shift()
      this.tmpWindows.push(discardWin)
      setImmediate(async () => {
        for (let i = winblend; i <= 100; i++) {
          await discardWin.setOption('winblend', i)
          await new Promise(resolve => setTimeout(resolve, 500 / (100 - winblend)))
        }
        await discardWin.close()
        this.tmpWindows.shift()
      })
    }
  }

  public async start(notice: Notification): Promise<void> {
    const buf = await this.nvim.createNewBuffer()
    buf.setOption('bufhidden', 'wipe', true)
    buf.setOption('buftype', 'nowrite', true)

    const renderer = await this.render(notice)
    // buf was changed
    renderer.render(buf)

    await this.create(buf)
  }

  public async destroy(): Promise<void> {
    for (const w of this.windows.concat(this.tmpWindows)) {
      const isValid = await w.valid
      if (isValid) await w.close()
    }
  }
}
