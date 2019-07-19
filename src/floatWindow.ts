import { FloatOptions } from '@chemzqm/neovim/lib/api/types'
import { Buffer } from '@chemzqm/neovim/lib/api/Buffer'
import { Window, Neovim, WorkspaceConfiguration, workspace } from 'coc.nvim'

export default class FloatWindow {
  private window: Window = null
  private windows: Window[] = []
  private tmpWindows: Window[] = []
  private maxWinCount = 3

  constructor(private nvim: Neovim, private config: WorkspaceConfiguration) { }

  private async getWinConfig(buf: Buffer): Promise<FloatOptions> {
    let height = await this.nvim.eval('winheight(0)')
    let width = await this.nvim.getOption('columns')

    const floatWidth = this.config.get<number>('width', 30)
    const floatHeight = await buf.length

    const winConfig: FloatOptions = {
      focusable: false,
      relative: 'editor',
      anchor: 'NW',
      height: 4,
      width: floatWidth,
      row: Number(height) + 1,
      col: Number(width) - floatWidth,
    }

    return winConfig
  }

  public async moveUp(windows: Window[]): Promise<void> {
    // if (windows.length > 0) {
    //   for (const [n, win] of windows.entries()) {
    //     const isValid = await win.valid
    //     if (isValid) {
    //       const winCfg: FloatOptions = await win.getConfig()
    //       // winCfg.row -= 5
    //       // await win.setConfig(winCfg)
    //       // setImmediate(async () => {
    //       for (let i = 0; i <= 4; i++) {
    //         winCfg.row -= 1
    //         await win.setConfig(winCfg)
    //         await new Promise(resolve => setTimeout(resolve, 100))
    //       }
    //       // })
    //     } else {
    //       windows.splice(n, 1)
    //     }
    //   }
    // }

    await Promise.all(windows.map(async w => {
      const winCfg = await w.getConfig()
      for (let i = 0; i <= 4; i++) {
        winCfg.row -= 1
        await w.setConfig(winCfg)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }))
  }

  public async create(buf: Buffer): Promise<void> {

    const winConfig = await this.getWinConfig(buf)
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
    await this.moveUp(this.tmpWindows)

    await this.keepWindowCounts(this.maxWinCount)
  }

  /**
   * keep windows count when there are over one notifications
   */
  public async keepWindowCounts(maxWinCount: number): Promise<void> {
    const winblend = this.config.get<number>('winblend', 0)

    if (this.windows.length > maxWinCount) {
      let discardWin = this.windows.shift()
      this.tmpWindows.push(discardWin)
      setImmediate(async () => {
        for (let i = winblend; i <= 100; i++) {
          await discardWin.setOption('winblend', i)
          await new Promise(resolve => setTimeout(resolve, 10 - i / 10))
        }
        await discardWin.close()
        this.tmpWindows.shift()
      })
    }
  }
}
