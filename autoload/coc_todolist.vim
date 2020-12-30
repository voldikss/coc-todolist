" ============================================================================
" FileName: coc_todolist.vim
" Author: voldikss <dyzplus@gmail.com>
" GitHub: https://github.com/voldikss
" ============================================================================

" https://stackoverflow.com/a/26318602/8554147
function! coc_todolist#get_buf_info() abort
  let save_virtualedit = &virtualedit
  set virtualedit=all
  norm! g$
  let width = virtcol('.')
  let &virtualedit = save_virtualedit
  return [bufnr('%'), width]
endfunction
