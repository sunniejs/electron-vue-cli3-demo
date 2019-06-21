<template>
  <div>
    <img :src="imageUrl" alt="image">
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';

export default {
  created() {
    // 接受background.js 中发来的消息
    ipcRenderer.on('image', (event, arg) => {
      this.imageUrl = arg
    })
  },
  data() {
    return {
      imageUrl: ''
    }
  }
}
</script>

<style scoped>
img {
  max-width: 100%;
}
</style>


