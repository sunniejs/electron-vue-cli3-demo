  <template>
  <div class="about">
    <div>您可以扫描添加下方的微信并备注 Soul 加前端交流群，交流学习。</div>
    <div><img :src="image" alt=""></div>
    <div>electron-vue-cli3-demo</div>
    <div>https://github.com/sunnie1992/electron-vue-cli3-demo</div>
  </div>
</template>
 <script>

export default {
  name: 'about',
  data() {
    return {
      image: require('../assets/mine.png')
    }
  }

}
</script>
<style >
.about {
  display: flex;
  flex-direction: column;
  text-align: center;
}
</style>
