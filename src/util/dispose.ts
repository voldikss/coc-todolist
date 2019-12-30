import { Disposable } from 'coc.nvim'

export class Dispose implements Disposable {
  private subscriptions: Disposable[] = []

  push(subs: Disposable) {
    this.subscriptions.push(subs)
  }

  dispose() {
    if (this.subscriptions.length) {
      this.subscriptions.forEach(subs => {
        subs.dispose()
      })
      this.subscriptions = []
    }
  }
}
