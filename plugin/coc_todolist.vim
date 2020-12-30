" ============================================================================
" FileName: coc_todolist.vim
" Author: voldikss <dyzplus@gmail.com>
" GitHub: https://github.com/voldikss
" ============================================================================

function! s:CocTodolistActionAsync(name, ...)
  return call(
    \ 'CocActionAsync',
    \ extend(['runCommand', 'todolist.' . a:name], a:000)
    \ )
endfunction

augroup CocTodolistInternal
  autocmd!
  autocmd BufWriteCmd  * call s:CocTodolistActionAsync(
    \ 'internal.didVimEvent',
    \ 'BufWriteCmd',
    \ +expand('<abuf>')
    \ )
augroup END
