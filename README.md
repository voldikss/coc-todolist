# coc-todolist

Todolist/task manager extension for [coc.nvim](https://github.com/neoclide/coc.nvim)

## Install

```
:CocInstall coc-todolist
```

## Features

- Give you due remind you to do from vim
- Upload your todo history to gist
- CocList

## Configuration

```jsonc
"todolist.maxsize": {
    "type": "number",
    "default": 5000,
    "description": "maxsize of todolist"
},
"todolist.autoUpload": {
    "type": "boolean",
    "default": false,
    "description": "sync your todo every day when coc was started"
},
"todolist.monitor": {
    "type": "boolean",
    "default": false,
    "description": "whether to monitor the ddl and reminder you at the time"
},
"todolist.reminder.background": {
    "type": "string",
    "default": "",
    "description": "notification background"
},
"todolist.reminder.winblend": {
    "type": "number",
    "default": 100,
    "description": "opacity of reminder floating window"
},
"todolist.reminder.width": {
    "type": "number",
    "default": 30,
    "description": "width of reminder floating window"
},
"todolist.reminder.notify": {
    "type": "string",
    "default": "floating",
    "description": "width of reminder floating window",
    "enum": [
    "floating",
    "virtual",
    "echo",
    "none"
    ]
}
```

more information, see [package.json](https://github.com/voldikss/coc-todolist/blob/master/package.json)

## Keymaps

- normal mode: `<Plug>(coc-todolist-create)`
- normal mode: `<Plug>(coc-todolist-upload)`
- normal mode: `<Plug>(coc-todolist-download)`
- normal mode: `<Plug>(coc-todolist-export)`

## Commands

- `:CocCommand todolist.create`
- `:CocCommand todolist.upload`
- `:CocCommand todolist.download`
- `:CocCommand todolist.export`
- `:CocCommand todolist.clearNotice`

## CocList

run `:CocList todolist` to open the todolist

- Filter your todo items and perform operations via `<Tab>`
- Use `toggle` to toggle todo status between `active` and `completed`
- Use `preview` to preview
- Use `delete` to delete your todolist file
- Use `cancel` to make todo status to `cancelled`

## License

MIT

## Screenshots

![]()
![]()
