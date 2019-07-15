import { CompletionItemProvider } from 'coc.nvim'
import {
  CompletionItem,
  Range,
  Position,
  MarkupKind,
  CompletionItemKind
} from 'vscode-languageserver-protocol'

import { todoIdentifiers } from '../data/todoIdentifiers'

export const completionProvider: CompletionItemProvider = {
  provideCompletionItems(document, position): CompletionItem[] {
    const text = document.getText(Range.create(
      Position.create(position.line, 0),
      Position.create(position.line, position.character),
    ))
    if (/^[ \t]*[^ \t]*$/.test(text)) {
      return Object.keys(todoIdentifiers).map<CompletionItem>(name => ({
        label: name,
        kind: CompletionItemKind.Method,
        insertText: `${name}: `,
        documentation: {
          kind: MarkupKind.Markdown,
          value: todoIdentifiers[name].document.join('\n')
        }
      }))
    } else if (/^[ \t]*[^ \t]+[ \t]\w*$/.test(text)) {
      const m = text.match(/^[ \t]*([^ \t]+?):?[ \t]\w*$/)
      if (m && todoIdentifiers[m[1]]) {
        return todoIdentifiers[m[1].trim()].values.map<CompletionItem>(v => ({
          label: v,
          kind: CompletionItemKind.Value,
          insertText: v
        }))
      }
    }
    return []
  }
}
