<template lang="pug">
  div(:class="$style.toolbar")
    Button(ma="menu" @click.native="$emit('leftClick')")
    Button(fa="save" @click.native='save', :disabled="saved")
    Button(fa="copy" @click.native='copy', :disabled="!canCopy")
    Button(fa="cut" @click.native='cut', :disabled="!canCut")
    Button(ma="content_paste" @click.native='paste', :disabled="!canPaste")
    Button(fa="clone" @click.native="dup")
    Button(fa="trash-o" @click.native='trash', :disabled="!canTrash")
    Button(ma="undo" @click.native="undo", :disabled="!canUndo")
    Button(ma="redo" @click.native="redo", :disabled="!canRedo")
    LinkIcon(ma="visibility" v-show="page._id!=newId" target="_blank" rel="noopener", :href="url")
    Button(fa="cube" @click.native="createCube", :disabled="!canCreateCube")
    Button(fa="cubes" @click.native="toggleBlock", :disabled="!canToggleBlock")
    Button(ma="menu" @click.native="$emit('rightClick')" right)
</template>

<script>
import { bus, clone, getCubeStyles, getCubeBlocks, getPageCubes, Block, ObjectId, NanoId, NanoSlug, Clipboard } from '../data/factory'
import cloneDeep  from 'lodash/cloneDeep'
import debounce from 'lodash/debounce'
import isEqual from 'lodash/isEqual'
import { mapState, mapGetters } from 'vuex'
import Button from './ButtonToolbar'
import LinkIcon from './LinkIcon'

export default {
  components: {
    Button, LinkIcon
  },
  data() {
    return {
      stopWatchHandler: null,
      clipboard: null,
      // toggle_exclusive: 2,
      // toggle_multiple: [],
      // toggle_options: [
      //   { icon: 'format_align_left', value: 1 },
      //   { icon: 'format_align_center', value: 2 },
      //   { icon: 'format_align_right', value: 3 },
      //   { icon: 'format_align_justify', value: 4 },
      // ],
      // toggle_options_multiple: [
      //   { icon: 'format_bold', value: 1 },
      //   { icon: 'format_italic', value: 2 },
      //   { icon: 'format_underlined', value: 3 },
      //   { icon: 'format_color_fill', value: 4 }
      // ],
    }
  },
  computed: {
    ...mapGetters([
      'page'
    ]),
    ...mapState([
      'newId',
      'pageId',
      'histories',
      'user',
    ]),
    ...mapState({
      history (state) {
        return this.histories[state.pageId]
      },
    }),
    saved(){
      return this.history.sid == this.page.sid
    },
    url(){
      return this.page.url.startsWith('/') ? this.page.url : '//'+this.page.url
    },
    canTrash(){
      return this.pageId != this.newId || this.history.stack.length > 1
    },
    canUndo(){
      return this.history.index > 0
    },
    canRedo(){
      return this.history.stack.length - 1 > this.history.index
    },
    canCreateCube(){
      return this.activeCube && this.activeCube.name != "Page" && !this.activeCube.src
    },
    canToggleBlock(){
      return this.activeCube && this.activeCube.name != "Page" && !this.activeCube.block
    },
    canCopy(){
      return this.activeCube && this.activeCube.name != 'Page'
    },
    canCut(){
      return this.activeCube && this.activeCube.name != 'Page'
    },
    canPaste(){
      return this.activeCube && this.clipboard
    },
    cubes: {
      get() {
        return this.page.cubes
      },
      set(cubes) {
        this.$store.commit('setCubes', cubes)
      }
    },
    activeCube:{
      get(){
        return this.$store.state.activeCube
      },
      set(cube){
        this.$store.commit('setActiveCube', cube)
      }
    }
  },
  methods: {
    toggleBlock(){
      if (this.activeCube.block) return
      if (this.activeCube.name == 'Block'){
        let origin = this.$store.state.cubes[this.activeCube.src]
        let cube = clone(origin, this.user._id)
        cube.block = false
        this.setCube(this.activeCube, cube)

        // UPDATE BLOCKS COUNT
        let i = origin._id
        this.page.blocks[i]--
        if (this.page.blocks[i] <= 0)
          this.$delete(this.page.blocks, i)
        // END UPDATE
      } else {
        // Create cube
        let cube = clone(this.activeCube, this.user._id)
        // Create block
        let block = Block(cube, this.user._id)
        cube.block = true
        this.$store.dispatch('addCube', cube)
        this.watchCube(cube)
        this.setCube(this.activeCube, block)
        // UPDATE BLOCKS COUNT
        this.$set(this.page.blocks, cube._id, 1)
        // END UPDATE
      }
    },
    createCube(){
      let cube = clone(this.activeCube, this.user._id)
      cube.block = false
      this.$store.dispatch('addCube', cube)
      this.watchCube(cube)

      this.activeCube.src = cube._id
      // delete this.activeCube.style
      // UPDATE BLOCKS COUNT
      this.$set(this.page.blocks, cube._id, 1)
      // END UPDATE
    },
    snapshot(page, activeId) {
      let state = this.$store.state
      let cubes = getPageCubes(page, state)

      let h = this.histories[page._id]
      let snap = h.stack[h.index]
      snap.activeId = activeId
      if (!isEqual(snap.page, this.page)){
        this.stopWatch()
        page.sid = NanoId()
        this.startWatch()
      }
      h.index++
      h.stack.splice(h.index)
      h.stack.push({ page: cloneDeep(page), activeId: activeId, cubes })
    },
    undo(){
      if (!this.canUndo) return
      let h = this.history
      h.index--
      let snap = h.stack[h.index]
      this.loadSnap(snap)
    },
    redo(){
      if (!this.canRedo) return
      let h = this.history
      h.index++
      let snap = h.stack[h.index]
      this.loadSnap(snap)
    },
    loadSnap(snap){
      if (this.page.sid != snap.page.sid){
        this.stopWatch()
        this.$store.commit('setPage', cloneDeep(snap.page))
        this.startWatch()
        this.autoSavePage(this.page)
      }
      for (let i in snap.cubes){
        if (!isEqual(snap.cubes[i], this.$store.state.cubes[i])){
          let cube = cloneDeep(snap.cubes[i])
          this.$store.commit('setCube', cube)
          this.watchCube(cube)
          this.autoSaveCube(cube)
        }
      }
      this.activeCube = this.getActiveCube(snap.activeId)
    },
    getActiveCube(id){
      if (this.page._id == id) return this.page

      var find = cubes => {
        if (!cubes) return
        let r = cubes.find(e => e._id == id)
        if (r) return r
        for (let i in cubes){
          let c = cubes[i]
          if (c.src){
            let origin = this.$store.state.cubes[c.src]
            if (origin._id == id)
              return origin
            else {
              let cc = find(origin.cubes)
              if (cc) return cc
            }
          }
          else if (c.cubes && c.cubes.length > 0){
            let cc = find(c.cubes)
            if (cc) return cc
          }
        }
      }
      return find(this.cubes)
    },
    async save(){
      if (this.saved) return
      this.savePage(this.page)
    },
    async savePage(page){
      // if saved return
      if (this.histories[page._id].sid == this.page.sid) return

      try {
        if (page._id == this.newId){
          await this.$store.dispatch('addPage', page)
          this.stopWatch()
          this.$store.commit('addNewPage')
          this.startWatch()
          this.history.sid = page.sid
          this.$router.push({ name: 'build', params: { id: page._id }})
          console.log('page created');
        } else {
          await this.$store.dispatch('updatePage', page)
          this.history.sid = page.sid
          console.log('page updated');
        }
      } catch (e) {
        alert('Error while trying to save: ' + e.message)
        console.error(e)
      }
    },
    startWatch(){
      if (this.stopWatchHandler) return
      this.stopWatchHandler = this.$store.watch(() => this.$store.state.pages, () => {
        this.pagesChanged(this.page, this.activeCube._id)
      }, {deep: true})
    },
    stopWatch(){
      if (this.stopWatchHandler){
        this.stopWatchHandler()
        this.stopWatchHandler = null
      }
    },
    pagesChanged: debounce(function(page, activeId) {
      this.snapshot(page, activeId)
      this.savePage(page)
    }, 500),
    autoSavePage: debounce(function(page) {
      this.savePage(page)
    }, 500),
    autoSaveCube: debounce(function(cube) {
      this.saveCube(cube)
    }, 500),
    copy(){
      if (!this.activeCube || this.activeCube.name == 'Page') return
      let cube = cloneDeep(this.activeCube)
      cube.block = false
      this.clipboard = Clipboard(cube)
      console.log('copied');
    },
    cut(){
      if (!this.activeCube || this.activeCube.name == 'Page') return
      this.clipboard = Clipboard(cloneDeep(this.activeCube))
      this.removeActiveCube()
      console.log('cut');
    },
    paste(){
      if (!this.activeCube || !this.clipboard) return

      let c = clone(this.clipboard.cube, this.user._id)

      // UPDATE BLOCKS COUNT
      let blocks = getCubeBlocks(c, this.$store.state.cubes)
      for (let i in blocks){
        let count = this.page.blocks[i]
        this.$set(this.page.blocks, i, count ? count+blocks[i] : blocks[i])
      }
      // END UPDATE

      if (this.activeCube.cubes && this.activeCube.name != "Block"){
        this.activeCube.cubes.push(c)
      } else {
        this.cubes.push(c)
      }
      console.log('pasted');
    },
    async dupPage(p){
      try {
        p._id = ObjectId()
        p.content += ' Copy'
        p.path = NanoSlug()
        p.host = this.$store.state.host
        p.url = p.host + '/' + p.path
        this.stopWatch()
        this.$store.commit('setNewPage', p)
        this.startWatch()
        this.activeCube = p
        this.$router.push({ name: 'build', params: { id: p._id }})
        await this.$store.dispatch('addPage', p)
      } catch (e) {
        alert('Error while trying to save: ' + e.message)
        console.error(e)
      }
    },
    async dup(){
      if (this.activeCube == this.page) {
        let p = clone(this.page, this.user._id)
        await this.dupPage(p)
      }
      else {
        let cube = clone(this.activeCube, this.user._id)
        cube.block = false
        this.cubes.push(cube)
        console.log('duped');
      }
    },
    trash(){
      if (!this.activeCube) return
      // remove page
      if (this.activeCube == this.page) {
        if (!confirm("Do you want to delete this page?")) return
        this.stopWatch()
        this.$store.dispatch('deletePage', this.page)
        this.startWatch()
        this.$router.push({ name: 'build' })
      }
      else this.removeActiveCube()
    },
    removeActiveCube(){
      if (this.activeCube.name == 'Page') return

      var remove = cubes => {
        if (!cubes) return
        let index = cubes.indexOf(this.activeCube)
        if (index > -1){
          cubes.splice(index, 1)
          this.activeCube = this.page
        } else {
          cubes.map(c => {
            if (c.name == 'Block')
              remove(this.$store.state.cubes[c.src].cubes)
            else if (c.cubes && c.cubes.length > 0)
              remove(c.cubes)
          })
        }
      }
      // UPDATE BLOCKS COUNT
      let blocks = getCubeBlocks(this.activeCube, this.$store.state.cubes)
      for (let i in blocks){
        let count = this.page.blocks[i]
        this.$set(this.page.blocks, i, count ? count-blocks[i] : 0)
        if (this.page.blocks[i] <= 0)
          this.$delete(this.page.blocks, i)
      }
      // END UPDATE
      remove(this.cubes)
    },
    setCube(cube, newCube){
      if (this.activeCube.name == 'Page') return
      var set = cubes => {
        let index = cubes.indexOf(cube)
        if (index > -1){
          this.$set(cubes, index, newCube)
          this.activeCube = newCube
        } else {
          cubes.map(c => {
            if (c.cubes && c.cubes.length > 0)
              set(c.cubes)
            // if (c.src){
            //   set(this.$store.state.cubes[c.src].cubes)
            // } else if (c.cubes && c.cubes.length > 0)
            //   set(c.cubes)
          })
        }
      }
      set(this.cubes)
    },
    // Return { cube_id: cube, ... }
    getCubes(cube){
      let blocks = {}
      let list = this.$store.state.cubes
      var getBlocks = cubes => {
        if (!cubes) return
        for (let i in cubes){
          let c = cubes[i]
          if (c.src && list[c.src])
            blocks[c.src] = list[c.src]

          if (c.name == 'Block'){
            let s = list[c.src]
            if (s && s.src)
              blocks[s.src] = list[s.src]

            if (s && s.cubes) getBlocks(s.cubes)
          }

          if (c.cubes && c.cubes.length > 0)
            getBlocks(c.cubes)
        }
      }
      if (cube.src)
        blocks[cube.src] = list[cube.src]

      if (cube.name == 'Block'){
        let s = list[cube.src]
        if (s.src)
          blocks[s.src] = list[s.src]

        if (s.cubes) getBlocks(s.cubes)
      }
      getBlocks(cube.cubes)
      return Object.keys(blocks).length == 0 ? null : blocks
    },
    cubeChanged: debounce(function(val) {
      this.snapshot(this.page, this.activeCube._id)
      this.saveCube(val)
    }, 500),
    startCubesWatch(){
      let c = this.$store.state.cubes
      for (let i in c){
        this.watchCube(c[i])
      }
    },
    watchCube(cube){
      this.$store.watch(() => cube, (val, old) => {
        this.cubeChanged(val)
      }, {deep: true})
    },
    async saveCube(cube){
      try {
        await this.$store.dispatch('updateCube', cube)
        console.log('cube updated')
      } catch (e) {
        alert('Error while trying to save: ' + e.message)
        console.error(e)
      }
    },
  },
  mounted() {
    if (this.stopWatchHandler) return

    this.startWatch()
    this.startCubesWatch()

    document.addEventListener("copy", e => {
      if (!this.activeCube || e.target.tagName == 'INPUT' || e.target.tagName == 'TEXTAREA') return
      e = e || window.event // IE
      let c = Clipboard(this.activeCube, this.getCubes(this.activeCube))
      // console.log(c);
      e.clipboardData.setData("text/plain", JSON.stringify(c))
      e.preventDefault()
      console.log('copied');
    })

    document.addEventListener("cut", e => {
      if (!this.activeCube || e.target.tagName == 'INPUT' || e.target.tagName == 'TEXTAREA') return
      e = e || window.event // IE
      let c = Clipboard(this.activeCube, this.getCubes(this.activeCube))
      e.clipboardData.setData("text/plain", JSON.stringify(c))
      this.removeActiveCube()
      e.preventDefault()
      console.log('cut');
    })

    document.addEventListener('paste', e => {
      if (!this.activeCube || e.target.tagName == 'INPUT' || e.target.tagName == 'TEXTAREA') return
      try {
        let clipboardData = e.clipboardData || window.clipboardData
        let s = clipboardData.getData('Text')
        let c = JSON.parse(s)
        let cube = clone(c.cube, this.user._id)

        if (c.cubes){
          // ADD NEW CUBES TO DB
          this.$store.dispatch('addCubes', c.cubes)
        }

        if (cube.name == 'Page'){
          this.dupPage(cube)
        }
        else {
          // UPDATE BLOCKS COUNT
          let blocks = getCubeBlocks(cube, this.$store.state.cubes)
          for (let i in blocks){
            let count = this.page.blocks[i]
            this.$set(this.page.blocks, i, count ? count+blocks[i] : blocks[i])
          }
          // END UPDATE

          if (this.activeCube.cubes && this.activeCube.name != "Block"){
            this.activeCube.cubes.push(cube)
          } else {
            this.cubes.push(cube)
          }
        }
        console.log('pasted');
      } catch (e) {
        console.log(e);
      }
    })

    document.addEventListener('keydown', e => {
      e = e || window.event // IE
      var metaKey = navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey

      if (e.keyCode == 8 || e.keyCode == 46){
        e.preventDefault()
        this.trash()
      }
      else if (e.keyCode == 90 && e.shiftKey && metaKey) {
        e.preventDefault()
        // console.log("⌘+⌃+z")
        this.redo()
      }
      else if (e.keyCode == 90 && metaKey) {
        e.preventDefault()
        // console.log("⌘+z")
        this.undo()
      }
      else if (e.keyCode == 83 && metaKey){
        e.preventDefault()
        // console.log("⌘+s")
        this.save()
      }
      else if (e.keyCode == 68 && metaKey){
        e.preventDefault()
        this.dup()
      }
      // else if (e.keyCode == 67 && metaKey){
      //   this.copy()
      // }
      // else if (e.keyCode == 88 && metaKey){
      //   this.cut()
      // }
      // else if (e.keyCode == 86 && metaKey){
      //   this.paste()
      // }
    }, false)
  }
}
</script>

<style lang="stylus" module>
.toolbar
  width 100%
  height 48px
  position fixed
  z-index 3
  color rgba(0,0,0,.87)
  background-color #f5f5f5
  will-change padding-left, padding-right
  transition .3s cubic-bezier(.25,.8,.5,1)
  box-shadow 0 1px 3px rgba(0,0,0,.2),0 1px 1px rgba(0,0,0,.14),0 2px 1px -1px rgba(0,0,0,.12)
</style>
