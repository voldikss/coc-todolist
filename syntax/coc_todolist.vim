" ============================================================================
" FileName: coc_todolist.vim
" Author: voldikss <dyzplus@gmail.com>
" GitHub: https://github.com/voldikss
" ============================================================================

if exists('b:current_syntax')
  finish
endif
let b:current_syntax = 'coc_todolist'

syntax match CocTodolistKeyword          '\(TOPIC\|DATE\|ACTIVE\|DUE\|DETAIL\)'
syntax match CocTodolistComment          '\%<3l.*'
syntax match CocTodolistDelimiter        '─'

hi def link CocTodolistKeyword            Keyword
hi def link CocTodolistComment            Comment
hi def link CocTodolistDelimiter          Special
hi def link CocTodolistSelect             Search
