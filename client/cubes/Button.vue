<template lang="pug">
  button(
    :edit="edit"
    :active="active"
    :class="css"
    @click.stop="onClick"
    @mouseover.stop="") {{ cube.content }}
</template>

<script>
import cssMixin from '../mixins/css'
export default {
  props: ['cube','select','edit','parent'],
  mixins: [cssMixin],
  computed: {
    css(){
      return [
        this.$style.button,
        this.cubeCss,
      ]
    },
  },
  methods: {
    onClick(){
      if (this.edit)
        this.select(this.cube, this.$el, this.parent)
      else if (this.cube.url) {
        if (this.cube.url == 'back')
          this.$router.go(-1)
        else
          window.location = this.cube.url
          // this.$router.push(this.cube.url)
      }
    },
  },
}
</script>

<style lang="stylus" module>
.button
  composes cube from "./cube.css"
  outline none
  background-color #f5f5f5
  border-radius 0
  cursor pointer
  display inline-block
  border none
  padding .6em 1.7em
  // border 1px solid rgba(0,0,0,.15)
  // box-shadow 0 1px 2px rgba(0,0,0,0.1)
  &:hover
    border-color rgba(0,0,0,.3)
    box-shadow 0 1px 5px rgba(0,0,0,0.1)
  &:active
    box-shadow 0 2px 2px rgba(0,0,0,0.1)
  &[edit]
    cursor pointer
</style>
