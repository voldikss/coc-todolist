const dateObj = new Date()
const day = dateObj.getDate().toString()
const year = dateObj.getFullYear().toString()
const month = (dateObj.getMonth() + 1).toString()
const hour = dateObj.getHours()
const minute = dateObj.getMinutes()
const time = `${hour}:${minute}`
const date = `${year}-${month}-${day}`
const fdate = date + ' ' + time

// TODO: use snippets instead of template
export const todoTemplate = [
  'Title: ',
  `Create_At: ${fdate}`,
  `Alarm_At: ${fdate}`, // TODO: 10 min later
  'Status: todo',
  'Alarm: ',
  'Tags: ',
  '  - ',
  '',
  'Content: ',
  '  - '
]
