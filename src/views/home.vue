<template>
  <div class="home">
    <ImageList />
  </div>
</template>

<script>
// @ is an alias to /src
import ImageList from '@/components/ImageList.vue'

export default {
  name: 'home',
  components: {
    ImageList
  }
}
</script>
