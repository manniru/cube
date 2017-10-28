import { create } from 'jss'
import preset from 'jss-preset-default'
// import hash from 'murmurhash-js/murmurhash3_gc'
import { hashString as hash }  from './hash'
import createGenerateClassName from 'jss/lib/utils/createGenerateClassName'

const meta = 's'
const isNotFalsy = val => !!val
const getClassName = rule => rule.className
const generateClassName = (name, str) => `${name}${hash(str)}`
const mergeStyles = (style, rule) => ({...style, ...rule.style})

export default function stylish(jss, options) {
  const renderSheet = () => (
    jss.createStyleSheet(null, {meta, link: false, ...options}).attach()
  )

  let sheet = renderSheet()

  function css(...rules) {
    // Filter falsy values to allow `css(a, test && c)`.
    rules = rules.filter(isNotFalsy)

    if (!rules.length) return ''

    // A joined class name from all rules.
    const className = rules.map(getClassName).join('--')

    if (sheet.getRule(className)) return className

    const style = rules.reduce(mergeStyles, {})
    sheet.addRule(className, style, {selector: `.${className}`})

    return className
  }

  function cs(...styles) {
    // Filter falsy values to allow `css(a, test && c)`.
    styles = styles.filter(isNotFalsy)

    if (!styles.length) return ''

    // Get rules with class name and style
    let rules = Object.values(styles.reduce((map, style) => {
      let name = generateClassName(meta, JSON.stringify(style))
      map[name] = {
        className: name,
        style: style
      }
      return map
    }, {}))

    // A joined class name from all rules.
    const className = rules.map(getClassName).join('-')

    if (sheet.getRule(className)) return className

    const style = rules.reduce(mergeStyles, {})
    sheet.addRule(className, style, {selector: `.${className}`})

    return className
  }

  function createSheet(styles) {
    return Object.keys(styles).reduce((map, name) => {
      map[name] = {
        className: generateClassName(name, JSON.stringify(styles[name])),
        style: styles[name]
      }
      return map
    }, {})
  }

  function reset() {
    jss.removeStyleSheet(sheet)
    sheet = renderSheet()
  }

  return {
    cs,
    css,
    reset,
    createSheet,
    toString: () => sheet.toString(),
  }
}

export const {cs, css, reset, createSheet, toString} = stylish(create(preset()))
