<template>
  <div class="container">
    <!-- id是为了解决通过ref获取webview报错的问题（原因未知） -->
    <webview id="printWebview" ref="printWebview" :src="fullPath" nodeintegration />
  </div>
</template>

<script>
// eslint-disable-next-line
import { ipcRenderer, dialog } from 'electron';
import path from 'path';

export default {
  name: 'PrintWebView',

  components: {
  },

  props: {
    XmlData: {
      type: String,
      default: '',
    },
    dataType: {
      type: String,
      default: 'xml',
    },
    printType: {
      type: String,
      default: 'none',
    },
  },

  data() {
    return {
      fullPath: path.join(__static, 'print.html'),
      qrcodeText: '',
      printList: [],
      dialogVisible: false,
      // 打印机名称
      printDeviceName: 'BTP-U60(U) 1',
      qrcodeSize: 80,
      imageWidth: null,
      imageHeight: null,
      messageBox: null,
    };
  },


  mounted() {
    console.log(path.join(__static, 'print.html'))
    // ipcRenderer.send('getPrinterList');
    // ipcRenderer.once('getPrinterList', (event, data) => {
    //   console.log(event, data)
    // });

    const webview = this.$refs.printWebview;

    // 在<webview>dom渲染完成后监听xmlData，解决<webview>未渲染完成就已经触发XmlData
    webview.addEventListener('dom-ready', () => {
      // 发送信息到<webview>里的页面
      webview.send('webview-print-render', {
        printName: this.printDeviceName,
        imgSource: 'https://weapp.top1buyer.com/environment/s-search-class@2x.png',
        imgWidth: '76px',
        imgHeight: '62px',
      });
      // this.$watch('XmlData', (val) => {
      //   if (val === '') return;
      //   this.checkPrintConfig();
      // }, {
      //     immediate: true,
      //   });
    });

    webview.addEventListener('ipc-message', (event) => {
      if (event.channel === 'webview-print-do') {
        webview.print(
          {
            silent: true,
            printBackground: true,
            deviceName: this.printDeviceName,
          },
          (data) => {
            //   this.messageBox.close();
            console.log('webview success', data);
            if (data) {
              this.$emit('complete');
            } else {
              this.$emit('cancel');
            }
          },
        );
      }
    });
  },
  methods: {

    checkPrintName(name) {
      if (name) {
        this.printDeviceName = name;
        this.getPrintListHandle(name, false);
        // this.createCanvas();
      } else {
        this.getPrintListHandle(name, true);
      }
    },
    printSelectAfter(val) {
      this.dialogVisible = false;
      const printForm = { ...this.$electronStore.get('printForm') };
      printForm[this.printType] = val.name;
      this.$electronStore.set('printForm', Object.assign({}, printForm));

      this.printDeviceName = val.name;
      // this.createCanvas();
    },

    printRender(imgsrc) {
      // 获取<webview>节点
      // const webview = document.getElementById('printWebview');
      const webview = this.$refs.printWebview;
      // 发送信息到<webview>里的页面
      webview.send('webview-print-render', {
        printName: this.printDeviceName,
        imgSource: imgsrc,
        imgWidth: this.imageWidth,
        imgHeight: this.imageHeight,
      });
    },

    getPrintListHandle(printerName, dialogShow) {
      // 发送获取打印机列表的请求到主线程，并且得到打印机列表
      // const printNameList = ipcRenderer.sendSync('get-print-list');
      // 改用ipc异步方式获取列表，解决打印列数量多的时候导致卡死的问题
      ipcRenderer.send('getPrinterList');
      ipcRenderer.once('getPrinterList', (event, data) => {
        this.printList = data;
        // 1.判断是否有打印服务
        if (this.printList.length <= 0) {
          this.$message({
            message: '打印服务异常,请尝试重启电脑',
            type: 'error',
          });
          this.$emit('cancel');
        } else if (dialogShow) {
          this.dialogVisible = dialogShow;
        } else {
          this.checkPrinter(printerName);
        }
      });
    },

    // 2.判断是否有所选的打印机
    checkPrinter(printerName) {
      const hasDevice = this.printList.find(device => device.name === printerName);
      if (hasDevice) {
        this.createCanvas();
      } else {
        this.$message({
          message: '打印服务异常,无法找到打印机',
          type: 'error',
        });
        this.$emit('cancel');
      }
    },

    handlePrintDialogCancel() {
      this.$emit('cancel');
      this.dialogVisible = false;
    },
  },
};
</script>

<style lang='scss' scoped>
.container {
  position: fixed;
  right: -500px;
}
</style>
