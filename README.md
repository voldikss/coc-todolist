# coc-todolist

Todolist/task manager extension for [coc.nvim](https://github.com/neoclide/coc.nvim)

## Install

```
:CocInstall coc-todolist
```

## Features

- Allow to set a reminder for a todo item
- Auto sync your todolist with gist(require github token once: [generate](https://github.com/settings/tokens/new?scopes=gist&description=coc-todolist%20gist))
- Manage you todolist with CocList

## Configuration

```jsonc
"todolist.enable": {
    "type": "boolean",
    "default": true,
    "description": "whether enable this extension"
},
"todolist.maxsize": {
    "type": "number",
    "default": 5000,
    "description": "maxsize of todolist"
},
"todolist.autoUpload": {
    "type": "boolean",
    "default": false,
    "description": "upload your todolist every day"
},
"todolist.monitor": {
    "type": "boolean",
    "default": false,
    "description": "monitor the todolist and reminder you at the time"
},
"todolist.reminder.background": {
    "type": "string",
    "default": "",
    "description": "notification floating window background(e.g. #000000)"
},
"todolist.reminder.winblend": {
    "type": "number",
    "default": 0,
    "description": "opacity of notification floating window"
},
"todolist.reminder.width": {
    "type": "number",
    "default": 30,
    "description": "width of notification floating window"
},
"todolist.reminder.notify": {
    "type": "string",
    "default": "floating",
    "description": "how to notify you",
    "enum": ["floating", "virtual", "echo", "none"]
}
```

more information, see [package.json](https://github.com/voldikss/coc-todolist/blob/master/package.json)

## Commands

- `:CocCommand todolist.create`: create a new todo
- `:CocCommand todolist.upload`: upload todolist to gist
- `:CocCommand todolist.download`: download todolist from gist
- `:CocCommand todolist.export`: export todolist as a json/yaml file
- `:CocCommand todolist.clearNotice`: clear all notifications

## CocList

run `:CocList todolist` to open the todolist

- Filter your todo items and perform operations via `<Tab>`
- Use `toggle` to toggle todo status between `active` and `completed`
- Use `edit` to edit the description of a todo item
- Use `preview` to preview a todo item
- Use `delete` to delete a todo item

## F.A.Q

Q: Where are the todolist data stored?

A: Normally the data is saved in `~/.config/coc/extensions/coc-todolist-data/`, but if you set `g:coc_extension_root` to another location, it will change as well

## License

MIT

## Screenshots

![](https://user-images.githubusercontent.com/20282795/61623340-08499000-aca9-11e9-9be1-e6d951b075c2.gif)
![](https://user-images.githubusercontent.com/20282795/61593014-d1be3780-ac0c-11e9-96cc-e3b787a27f46.png)


## Donation

- Paypal

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://paypal.me/voldikss)

- Wechat
<div>
	<img src="https://user-images.githubusercontent.com/20282795/62786670-a933aa00-baf5-11e9-9941-6d2551758faa.jpg" width=400>
</div>
