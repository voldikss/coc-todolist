# coc-todolist

Todolist/task manager extension for [coc.nvim](https://github.com/neoclide/coc.nvim)

## Install

```
:CocInstall coc-todolist
```

## Features

- Alarm
- Sync
- CocList

## Configuration

```jsonc
"todo.filetype": {
    "type": "string",
    "default": "todo",
    "description": "filetype to write todo content"
},
"todo.autoSync": {
    "type": "boolean",
    "default": true,
    "description": "sync your todo every day when coc was started"
}
```

more information, see [package.json](https://github.com/voldikss/coc-translator/blob/master/package.json)

## Keymaps

- normal mode: `<Plug>(coc-todolist-new)`
- normal mode: `<Plug>(coc-todolist-upload)`
- normal mode: `<Plug>(coc-todolist-download)`
- normal mode: `<Plug>(coc-todolist-export)`

## Commands

- `:CocCommand todolist.new`
- `:CocCommand todolist.upload`
- `:CocCommand todolist.download`
- `:CocCommand todolist.export`

## CocList

run `:CocList todolist` to open the translation list.

- Filter your translation items and perform operations via `<Tab>`
- Use `preview` to preview
- Use `edit` to edit your todolist file
- Use `delete` to delete your todolist file

## License

MIT

## Screenshots

![]()
![]()
