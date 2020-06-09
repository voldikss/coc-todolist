" ============================================================================
" FileName: coc_todolist.vim
" Author: voldikss <dyzplus@gmail.com>
" GitHub: https://github.com/voldikss
" ============================================================================

if exists('b:current_syntax')
  finish
endif


syntax match CocTodolistKeyword   #^\C\s\zs__\(TOPIC\|DATE\|ACTIVE\|DUE\|DESCRIPTION\)__#
syntax match CocTodolistComment   #\%1l.*#
syntax match CocTodolistDelimiter #\(─\|│\|┴\|┼\|┬\)#
syntax match CocTodolistTime      #[0-9:]\+#

syntax keyword CocTodolistTrue    true
syntax keyword CocTodolistFalse   false

hi def link CocTodolistKeyword    Keyword
hi def link CocTodolistComment    Comment
hi def link CocTodolistDelimiter  Special
hi def link CocTodolistTime       Number
hi def link CocTodolistTrue       Constant
hi def link CocTodolistFalse      Constant


let b:current_syntax = '__coc_todolist__'
