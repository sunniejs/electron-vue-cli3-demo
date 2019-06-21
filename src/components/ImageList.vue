<template>
  <div class="hello">
    <ul class="list-group list-group-flush">
      <li class="list-group-item flex-container" v-for="item in brands" :key="item.id" @click="openImage(item.thumbnail)">
        <img :src="item.thumbnail" alt="thumb" class="thumbnail">
        <div>{{ item.title }}</div>
      </li>
    </ul>
  </div>
</template>

<script>
const axios = require("axios");
// remote 模块提供了一种在渲染进程（网页）和主进程之间进行进程间通讯（IPC）的简便途径。
const { remote, ipcRenderer } = require("electron")
// menu 类可以用来创建原生菜单
const { Menu } = remote

export default {
  name: 'ImageList',
  props: {
    msg: String
  },
  data() {
    return {
      brands: []
    }
  },
  created() {
    this.initMenu()
    // 请求数据
    axios.get("https://www.easy-mock.com/mock/5d0b34f3ad411636d13589e3/electron/brands")
      .then(response => {
        this.brands = response.data.data.brands
      })
      .catch(error => {
        console.log(error)
      })
  },
  methods: {
    initMenu() { // 初始化菜单
      const menu = Menu.buildFromTemplate([
        {
          label: "文件",
          submenu: [
            {
              label: "设置",
              accelerator: "CmdOrCtrl+,",
              click: () => {
                ipcRenderer.send("toggle-about");
              }
            },
            { type: "separator" },
            {
              label: "退出",
              accelerator: "CmdOrCtrl+Q"
            }
          ]
        },
        {
          label: "演示菜单",
          submenu: [
            { label: "菜单 1" },
            { label: "菜单 2" },
            { label: "菜单 3" }
          ]
        }
      ]);
      Menu.setApplicationMenu(menu);
    },
    openImage(image) {

      ipcRenderer.send("toggle-image", image)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

.list-group {
  display: -ms-flexbox;
  display: flex;
  -ms-flex-direction: column;
  flex-direction: column;
  padding-left: 0;
  margin-bottom: 0;
}

.list-group-item {
  position: relative;
  display: block;
  padding: 0.75rem 1.25rem;
  margin-bottom: -1px;
  background-color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.list-group-flush .list-group-item {
  border-right: 0;
  border-left: 0;
  border-radius: 0;
}

.list-group-flush:first-child .list-group-item:first-child {
  border-top: 0;
}

.flex-container {
  display: flex;
  align-items: center;
}

.thumbnail {
  width: 60px;
  height: 60px;
  border-radius: 30px;
  margin-right: 16px;
}

.list-group-item {
  cursor: pointer;
}

.list-group-item:hover {
  background-color: #eee;
}
</style>
