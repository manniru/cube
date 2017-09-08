import generate from 'nanoid/generate'

export const NanoId = (length = 10) => generate('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', length)

export const NanoSlug = (length = 6) => generate('0123456789abcdefABCDEF', length)

export const ObjectId = (m = Math, d = Date, h = 16, s = s => m.floor(s).toString(h)) => s(d.now() / 1000) + ' '.repeat(h).replace(/./g, () => s(m.random() * h))

export function newPage(uid, host){
  let id = ObjectId()
  let path = NanoSlug()
  return {
    _id: id,
    name: 'Page',
    type: 'pg',
    host: host,
    path: path,
    url: host + '/' + path,
    uid: uid,
    content: 'New Page 🙌🏻',
    css: null,
    sid: NanoId(),
    style: {
      color: null,
      display: null,
      width: null,
      fontFamily: null,
      fontSize: null,
      fontWeight: null,
      lineHeight: null,
      letterSpacing: null,
      textTransform: null,
      textAlign: 'center',
      // flex: null,
      // flexFlow: null
    },
    cubes: []
  }
}

export function newStyle(name){
  return {
    _id: ObjectId(),
    name: name,
    style: {
      color: null,
      display: null,
      width: null,
      height: null,
      fontFamily: null,
      fontSize: null,
      fontWeight: null,
      lineHeight: null,
      letterSpacing: null,
      textTransform: null,
      textAlign: null,
      padding: null,
      margin: null,
      border: null,
      borderRadius: null,
      minWidth: null,
      minHeight: null,
      maxWidth: null,
      maxHeight: null,
    },
  }
}