" ============================================================================
" FileName: coc_todolist.vim
" Author: voldikss <dyzplus@gmail.com>
" GitHub: https://github.com/voldikss
" ============================================================================

augroup coc_todolist
  autocmd!
  autocmd BufWriteCmd __coc_todolist__   call s:Autocmd('BufWriteCmd', +expand('<abuf>'))
augroup END

function! s:Autocmd(...) abort
  if !get(g:,'coc_workspace_initialized', 0)
    return
  endif
  call coc#rpc#notify('CocAutocmd', a:000)
endfunction
