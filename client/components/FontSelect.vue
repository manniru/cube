<template lang="pug">
  Box(:w='w')
    portal(to='modal')
      Login
      v-dialog
      FontModal(:value="value" @input="select")
    Label(top) {{ lb }}
    div(:class="$style.box")
      Input(
        :value="value"
        :ph="ph"
        :style="{fontFamily: value || ph}"
        :class="$style.input"
        @input="select"
        @click.native.stop="show=true")
      div(:class="$style.addon" @click="open")
        i(class="fa fa-plus")
    div(:class="$style.select" v-show="show")
      ul(:class="$style.list")
        li(
          v-for="font in currentFonts"
          :style="{fontFamily: font}"
          :class="{[$style.font]:1, [$style.active]:font==value}"
          @click="select(font)") {{ font }}
        li(:class="$style.header")
          div(:class="$style.line")
          div(:class="$style.label") System Fonts
          div(:class="$style.line")
        li(v-for="font in systemFonts" :style="{fontFamily: font}" @click="select(font)" :class="{[$style.font]:1, [$style.active]:font==value}") {{ font }}
</template>

<script>
import Box from './Box'
import Input from './Input'
import Label from './Label'
import Login from './Login'
import FontModal from './FontModal'
import { mapState, mapGetters } from 'vuex'

export default {
  props: ['w','lb','ph','value'],
  components: {
    Box, Input, Label, Login, FontModal
  },
  data(){
    return {
      show: false,
      systemFonts: [
        '-apple-system, BlinkMacSystemFont, sans-serif',
        'Helvetica Neue, Helvetica, Arial, sans-serif',
        'Avenir Next, Helvetica, Arial, sans-serif',
        'Verdana, sans-serif',
        'Lucida Grande, sans-serif',
        'Menlo, monospace',
        'Roboto, sans-serif',
        'Roboto Condensed, sans-serif',
        'Roboto Mono, monospace',
        'Roboto Slab, Georgia, serif',
        'Montserrat, sans-serif',
        'Open Sans, sans-serif',
        'Lato, sans-serif',
        'Source Sans Pro, sans-serif',
        'PT Sans, sans-serif',
        'PT Serif, serif',
        'Raleway, sans-serif',
        'Merriweather, Georgia, serif',
        'Noto Sans, sans-serif',
      ]
    }
  },
  computed: {
    ...mapState([
      'recentFonts'
    ]),
    ...mapGetters([
      'page',
      'currentFonts'
    ]),
  },
  mounted() {
    const onClick = e => {
      if (this.show)
        this.show = false
    }
    // iOS does not recognize click events on document
    // or body, this is the entire purpose of the v-app
    // component and [data-app], stop removing this
    const app = document.querySelector('[data-app]') || document.body
    app.addEventListener('click', onClick, true)
  },
  methods: {
    select(font) {
      this.show = false
      this.$emit('input', font)
      if (
        !this.recentFonts.includes(font) &&
        !this.systemFonts.includes(font)
      )
      {
        this.recentFonts.unshift(font)
      }

      if (font){
        // UPDATE FONT COUNT
        let i = this.value
        // Add new font to page
        if (!this.page.fonts) this.page.fonts = {}
        let p = this.page.fonts
        let count = p[font]
        count = count ? count + 1 : 1
        this.$set(p, font, count)

        // Remove old font
        if (p[i]){
          p[i]--
          if (p[i] == 0) this.$delete(p, i)
        }
      }
    },
    open(){
      // this.showBasicDialog()
      // this.showTitleDialog()
      // this.showButtonsDialog()
      // this.$modal.show('login-modal')
      this.$modal.show('font-modal')
    },
    showBasicDialog () {
      this.$modal.show('dialog', {
        text: 'I am a tiny dialog box.<br/>And I render <b>HTML!</b>'
      })
    },
    showTitleDialog () {
      this.$modal.show('dialog', {
        title: 'Information',
        text: 'Check out, I have a title 😎'
      })
    },
    showButtonsDialog () {
      this.$modal.show('dialog', {
        title: 'Buttons example',
        text: 'You can add an arbitrary number of buttons.',
        buttons: [
          {
            title: 'C💩NCEL'
          },
          {
            title: 'LIKE',
            handler: () => {
              alert('LIKE LIKE LIKE')
            }
          },
          {
            title: 'REPOST',
            handler: () => {
              alert('REPOST REPOST REPOST')
            }
          }
        ]
      })
    },
  },
}
</script>

<style lang="stylus" module>
.box
  display flex

.input
  font-size 14px!important
  margin-right 0!important

.select
  position relative
  width 100%

.list
  position absolute
  background-color #fafafa
  z-index 100
  border 1px solid rgba(0,0,0,.15)
  overflow auto
  width 100%
  padding 0
  cursor pointer
  max-height 300px
  box-shadow 2px 2px 3px rgba(0,0,0,0.1)
  .font
    line-height 2
    padding 0 10px
    white-space nowrap
    &:hover
      background-color #eee
  .active
    background-color #eee

.header
  display flex
  &:hover
    background-color none!important
  .line
    //background-color rgba(63,70,82,.15)
    background-color #ddd
    flex-grow 1
    height 1px
    margin auto
  .label
    //color rgba(63,70,82,.4)
    /*font-weight 500*/
    color #ccc
    font-size 12px
    margin 5px 20px
    min-width 40px
    text-align center
    text-transform uppercase

.addon
  width 35px
  height 28px
  padding 3px
  margin-bottom: 0
  font-size 13px
  line-height: 1.25
  color: #464a4c
  text-align: center
  background-color: #eceeef
  border: 1px solid rgba(0,0,0,.15)
  border-radius: .25rem
  white-space: nowrap
  vertical-align: middle
  display: flex
  flex-direction: column
  justify-content: center
  border-left 0
  border-bottom-left-radius 0
  border-top-left-radius 0
  cursor pointer
</style>
