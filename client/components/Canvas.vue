<template lang="pug">
  .build(:class="{[$style.left]:left,[$style.right]:right}")
    link(v-for="f in currentFonts" v-if="fonts[f]", :href="fontUrl+fonts[f]" rel='stylesheet')
    //-style(v-for="c,i in blocks" v-if="c.name!='Block'" v-html="getRule(c)")
    Toolbar(
      :class="$style.toolbar"
      @leftClick="left = !left"
      @rightClick="right = !right")
    Navbar(:class="$style.navbar")
    Sidebar(
      v-if="activeCube"
      :cube='activeCube'
      :parent='activeParent'
      :class="$style.sidebar"
      @keydown.native="keydown"
      tabindex="1")
    draggable(
      v-model='cubes'
      :class="css"
      :options="{group:'cubes'}"
      @click.native.stop="selectPage"
    )
      component(v-for="(cube, i) in cubes", :cube="cube", :is="cube.type", :key="i", :edit="true", :select="selectCube")
      i
</template>

<script>
import Toolbar from './ToolBar'
import Navbar from './NavBar'
import Sidebar from './Sidebar'
import Draggable from 'vuedraggable'
import { mapState, mapGetters } from 'vuex'
import { fonts } from '../data/fonts'
import clone from 'lodash/clone'
import { css } from '../css-js/stylish'
// import { getFonts } from '../plugins/helpers'
// import css from '../css-js/styl'
const isProd = process.env.NODE_ENV === 'production'

export default {
  title: 'Build',
  async asyncData ({ store, route, context }) {
    store.state.e = context.e
    // store.state.env = context.env
    return store.dispatch('fetchBuild', route.params.id)
  },
  components: {
    Toolbar,
    Navbar,
    Sidebar,
    Draggable,
  },
  data() {
    return {
      left: true,
      right: true,
      fonts,
    }
  },
  computed: {
    ...mapGetters([
      'page',
      'currentFonts'
    ]),
    ...mapState({
      // blocks(state){
      //   return state.cubes
      // },
      // rules(state){
      //   return '<style>'+getRules(state.cubes)+'</style>'
      // },
      // pageFonts(state){
      //   return getFonts(state.cubes, this.page)
      // },
      user(state){
        return state.user
      },
    }),
    fontUrl(){
      return isProd ? 'https://bin.netlify.com/types/' :'/types/'
    },
    css(){
      return [
        this.$style.canvas,
        this.pageCss
      ]
    },
    pageCss(){
      return css(this.page.style, 'c'+this.page._id)
    },
    id(){
      return this.$route.params.id
    },
    activeCube: {
      get() {
        return this.$store.state.activeCube
      },
      set(cube) {
        this.$store.commit('setActiveCube', cube)
      }
    },
    activeParent: {
      get() {
        return this.$store.state.activeParent
      },
      set(cube) {
        this.$store.commit('setActiveParent', cube)
      }
    },
    activeElement: {
      get() {
        return this.$store.state.activeElement
      },
      set(el) {
        this.$store.commit('setActiveElement', el)
      }
    },
    cubes: {
      get() {
        return this.page.cubes
      },
      set(cubes) {
        this.$store.commit('setCubes', cubes)
      }
    },
  },
  watch: {
    id(){
      if (this.id != this.page._id) {
        this.$store.commit('setActivePage', this.id ? this.id : this.$store.state.newId)
        this.activeCube = this.page
      }
    },
  },
  mounted() {
    var { git_tag, now_url, now_region, now_plan, heroku_app, heroku_ver, heroku_des } = this.$store.state.e
    git_tag && console.log(git_tag)
    now_url && console.log(now_url, now_region, now_plan)
    heroku_app && console.log(heroku_app, heroku_ver, heroku_des)
    // console.log(this.$store.state.env)
    this.activeCube = this.page

    this.$store.state.recentFonts = clone(this.currentFonts)
  },
  methods: {
    // getRule(e){
    //   return css([e.style], '--'+e._id).toString()
    // },
    keydown(e){
      var metaKey = navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey
      if (e.keyCode == 8 || e.keyCode == 46 || ((e.keyCode == 67 || e.keyCode == 86 || e.keyCode == 88 || e.keyCode == 90) && metaKey))
        e.stopPropagation()
    },
    selectPage(){
      this.activeCube = this.page
    },
    selectCube(cube, el, parent){
      this.activeCube = cube
      this.activeElement = el
      this.activeParent = parent
    },
    // deselectCube(){
    //   this.activeCube = null
    // },
  }
}
</script>

<style lang="stylus" module>
$left := 300px
$right := 28em

.left
  .toolbar
  .canvas
    padding-left $left
  .navbar
    transform none

.right
  .toolbar
  .canvas
    padding-right $right
  .sidebar
    transform none

.navbar
  width $left
  transform translate3d(-100%, 0, 0)

.sidebar
  width $right
  transform translate3d(100%, 0, 0)

.canvas
  margin 0
  padding 48px 0 0
  min-height 100vh
  outline none
  transition padding .3s cubic-bezier(.25,.8,.5,1)
</style>
