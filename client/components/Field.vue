<template lang="pug">
  Box(:w='w')
    Label(top) {{ lb }}
    Input(
      :ph="ph"
      type="text"
      :readonly="readonly"
      :value="value"
      @input="val => $emit('input', val)"
      @change.native="e => $emit('change', e.target.value)")
</template>

<script>1
import Box from './Box'
import Input from './Input'
import Label from './Label'
export default {
  props: ['w','lb','ph','value','readonly'],
  components: {
    Box,
    Input,
    Label,
  },
}
</script>

<style lang="stylus" module>
</style>
