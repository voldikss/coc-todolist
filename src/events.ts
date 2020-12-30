import { commands, Disposable, ExtensionContext } from 'coc.nvim'

type Arguments<F extends Function> = F extends (...args: infer Args) => any
  ? Args
  : never

class EventListener<
  F extends (...args: A) => void | Promise<void>,
  A extends any[] = Arguments<F>
  > {
  listeners: F[] = []

  on(func: F, disposables?: Disposable[]) {
    this.listeners.push(func)
    const disposable = Disposable.create(() => {
      const index = this.listeners.indexOf(func)
      if (index !== -1) {
        this.listeners.splice(index, 1)
      }
    })
    if (disposables) {
      disposables.push(disposable)
    }
    return disposable
  }

  fire(...args: A) {
    this.listeners.forEach(async (listener) => {
      try {
        await listener(...args)
      } catch (e) {
        // nop
      }
    })
  }
}

export const bufWriteCmdListener = new EventListener<(bufnr: number) => void>()

const internalEventHanders: Record<'BufWriteCmd', (...args: any[]) => void> = {
  BufWriteCmd(args: [number]) {
    bufWriteCmdListener.fire(...args)
  },
}

export function registerVimInternalEvents(context: ExtensionContext): void {
  context.subscriptions.push(
    commands.registerCommand(
      'todolist.internal.didVimEvent',
      (event: keyof typeof internalEventHanders, ...args: any[]) =>
        internalEventHanders[event](args),
      undefined,
      true
    )
  )
}
