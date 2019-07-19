import { FloatOptions } from '@chemzqm/neovim/lib/api/types'
import { Buffer } from '@chemzqm/neovim/lib/api/Buffer'
import { Window, workspace } from 'coc.nvim'

export default class FloatWin {
  private window: Window = null
  private windows: Window[] = []
  private tmpWindows: Window[] = []
  constructor(private maxWinCount: number) {
    this.maxWinCount = maxWinCount
  }

  public async floatUp(windows: Window[]): Promise<void> {
    if (windows.length > 0) {
      for (const [n, win] of windows.entries()) {
        const isValid = await win.valid
        if (isValid) {
          const winCfg: FloatOptions = await win.getConfig()
          winCfg.row -= 5
          await win.setConfig(winCfg)
        } else {
          windows.splice(n, 1)
        }
      }
    }
  }

  public async new(buf: Buffer, winConfig: FloatOptions): Promise<void> {
    await this.floatUp(this.windows)
    await this.floatUp(this.tmpWindows)

    const { nvim } = workspace
    this.window = await nvim.openFloatWindow(buf, false, winConfig)
    this.windows.push(this.window)

    nvim.pauseNotification()
    this.window.setOption('number', false, true)
    this.window.setOption('relativenumber', false, true)
    this.window.setOption('cursorline', false, true)
    this.window.setOption('signcolumn', 'no', true)
    this.window.setOption('foldcolumn', 1, true)
    this.window.setOption('winhighlight', 'Normal:NormalFloat', true)
    // TODO
    // window.setOption('winhighlight', 'EndOfBuffer:TodoList', true)
    await nvim.resumeNotification()

    await this.removeSurplus(this.maxWinCount)
  }

  public async removeSurplus(maxWinCount: number): Promise<void> {
    if (this.windows.length > maxWinCount) {
      let discardWin = this.windows.shift()
      this.tmpWindows.push(discardWin)
      setImmediate(async () => {
        for (let i = 0; i <= 100; i++) {
          await discardWin.setOption('winblend', i)
          await new Promise(resolve => setTimeout(resolve, 10 - i / 10))
        }
        await discardWin.close()
        this.tmpWindows.shift()
      })
    }
  }
}

