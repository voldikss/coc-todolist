import { Disposable } from 'coc.nvim'

export class Dispose implements Disposable {
  private subscriptions: Disposable[] = []

  public push(subs: Disposable): void {
    this.subscriptions.push(subs)
  }

  public dispose(): void {
    if (this.subscriptions.length) {
      this.subscriptions.forEach(subs => {
        subs.dispose()
      })
      this.subscriptions = []
    }
  }
}
