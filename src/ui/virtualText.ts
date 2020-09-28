import { Neovim, workspace } from 'coc.nvim'

export default class VirtualText {
  private show = true
  private virtualTextSrcId: number

  constructor(private nvim: Neovim) { }

  public async showInfo(bufnr: number, lnum: number, text: string): Promise<void> {
    if (!this.show) return

    const doc = workspace.getDocument(bufnr)
    if (doc && this.virtualTextSrcId) {
      doc.buffer.clearNamespace(this.virtualTextSrcId, 0, -1)
    }

    this.virtualTextSrcId = await this.nvim.createNamespace('coc-todolist')
    const buffer = await this.nvim.buffer
    await buffer.setVirtualText(this.virtualTextSrcId, lnum - 1, [[text, 'WarningMsg']])
  }

  public async destroy(): Promise<void> {
    const buffer = await this.nvim.buffer
    const doc = workspace.getDocument(buffer.id)
    if (doc && this.virtualTextSrcId) {
      doc.buffer.clearNamespace(this.virtualTextSrcId, 0, -1)
      this.show = false
    }
  }
}
