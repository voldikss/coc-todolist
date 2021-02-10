" ============================================================================
" FileName: coc_todolist.vim
" Author: voldikss <dyzplus@gmail.com>
" GitHub: https://github.com/voldikss
" ============================================================================

let s:pattern = '─\w\+─'

function! s:map_down() abort
  if search(s:pattern, 'W') != 0
    normal! j
    normal! 0
  endif
  call s:rematch()
endfunction

function! s:map_up() abort
  call search(s:pattern, 'bW')
  call search(s:pattern, 'bW')
  normal! j
  normal! 0
  call s:rematch()
endfunction

function! s:map_gg() abort
  normal! gg
  call search(s:pattern, 'W')
  normal! j
  normal! 0
  call s:rematch()
endfunction

function! s:map_G() abort
  normal! G
  call search(s:pattern, 'bW')
  normal! j
  normal! 0
  call s:rematch()
endfunction

function! s:rematch() abort
  call clearmatches()
  let toplnum = line('.')
  let botlnum = search(s:pattern, 'nW')
  if botlnum == 0
    let botlnum = line('$')
  else
    let botlnum -= 1
  endif
  let pattern = join(map(range(toplnum, botlnum), { k,v -> '\%' . v . 'l.*' }), '\|')
  call matchadd('CocTodolistSelect', pattern)
endfunction

nnoremap <buffer><silent> j      :<C-u>call <SID>map_down()<CR>
nnoremap <buffer><silent> k      :<C-u>call <SID>map_up()<CR>
nnoremap <buffer><silent> <down> :<C-u>call <SID>map_down()<CR>
nnoremap <buffer><silent> <up>   :<C-u>call <SID>map_up()<CR>
nnoremap <buffer><silent> gg     :<C-u>call <SID>map_gg()<CR>
nnoremap <buffer><silent> G      :<C-u>call <SID>map_G()<CR>
