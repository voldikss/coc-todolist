# coc-todolist

![publish](https://github.com/voldikss/coc-todolist/workflows/publish/badge.svg)
[![npm version](https://badge.fury.io/js/coc-todolist.svg)](https://badge.fury.io/js/coc-todolist)

Todolist manager extension for [coc.nvim](https://github.com/neoclide/coc.nvim)

![](https://user-images.githubusercontent.com/20282795/61593014-d1be3780-ac0c-11e9-96cc-e3b787a27f46.png)

## Install

```
:CocInstall coc-todolist
```

## Features

- Allow to set a reminder for a todo item
- Auto upload/download todolists with gist
- Manage your todolist with CocList

## Configuration

```jsonc
"todolist.dateFormat": {
  "type": "string",
  "default": "YYYY-MM-DD HH:mm",
  "description": "dates format"
},
"todolist.monitor": {
  "type": "boolean",
  "default": false,
  "description": "monitor the todolist and remind you at the time"
}
```

## Commands

- `:CocCommand todolist.create`: create a new todo
- `:CocCommand todolist.upload`: upload todolist to gist
- `:CocCommand todolist.download`: download todolist from gist
- `:CocCommand todolist.export`: export todolist as a json/yaml file
- `:CocCommand todolist.clear`: clear all todos
- `:CocCommand todolist.gist.openBrowser`: open todolist gist in [gist.github.com](https://gist.github.com/)
- `:CocCommand todolist.gist.genToken`: generate a token used to update gist

## CocList

run `:CocList todolist` to open the todolist

- Filter your todo items and perform operations via `<Tab>`
- Use `toggle` to toggle todo status between `active` and `completed`
- Use `edit` to edit a todo item
- Use `preview` to preview a todo item
- Use `delete` to delete a todo item

## F.A.Q

Q: Where is the todolist data stored?

A: Normally the data is saved in `~/.config/coc/extensions/coc-todolist-data/`,
but if you set `g:coc_extension_root` to another location, it will change as
well

Q: coc-todolist is not loaded after upgrading

A: Remove `todolist.json`(normally
`~/.config/coc/extensions/coc-todolist-data/todolist.json`). Don't forget to
backup it if necessary.

Q: I want to create a persistent todolist item

A: Leave `due` value empty or let `due` be the same as `date` value(default)

## TODO

- sync
- Log
- UI

## License

MIT
