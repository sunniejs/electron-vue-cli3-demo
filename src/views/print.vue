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
  data() {
    return {
      fullPath: path.join(__static, 'print.html'),
      qrcodeText: '',
      printList: [],
      dialogVisible: false,
      // 打印机名称
      printDeviceName: '',
      qrcodeSize: 80,
      imageWidth: null,
      imageHeight: null,
      messageBox: null,
    };
  },

  // watch: {
  //   XmlData: {
  //     deep: true,
  //     immediate: true,
  //     handler(val = {}) {
  //       if (!val.PrintTemplate) return;
  //       this.checkPrintConfig();
  //     },
  //   },
  // },

  mounted() {
    const webview = this.$refs.printWebview;

    // 在<webview>dom渲染完成后监听xmlData，解决<webview>未渲染完成就已经触发XmlData
    webview.addEventListener('dom-ready', () => {
      this.$watch('XmlData', (val) => {
        if (val === '') return;
        this.checkPrintConfig();
      }, {
          immediate: true,
        });
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
            this.messageBox.close();
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
    checkPrintConfig() {
      const printList = this.$electronStore.get('printForm') || {};

      const typeObj = {
        receiptsPrint: () => {
          this.checkPrintName(printList.receiptsPrint);
        },
        ticketPrint: () => {
          this.checkPrintName(printList.ticketPrint);
        },
        rfidPrint: () => {
          this.checkPrintName(printList.rfidPrint);
        },
        memberPrint: () => {
          this.checkPrintName(printList.memberPrint);
        },
        none: () => {
          this.checkPrintName(null);
        },
      };

      typeObj[this.printType] && typeObj[this.printType]();
    },
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
      this.createCanvas();
    },
    transformToJson(json) {
      const obj = {
        C: {
          I: [],
        },
      };
      obj.C.$_h = json.canvas.height;
      obj.C.$_w = json.canvas.width;

      json.childNode.forEach((item) => {
        const node = {};
        node.$_t = item.t;
        node.$_x = item.x;
        node.$_y = item.y;
        node.$_w = item.w;
        node.$_h = item.h;
        node.$_si = item.si;
        node.$_f = item.f || '';
        node.__text = item.__text;
        obj.C.I.push(node);
      });

      return obj;
    },

    createCanvas() {
      this.messageBox = this.$message({
        message: '打印中，请稍后',
        duration: 0,
      });
      let canvasInfo;
      if (this.dataType === 'xml') {
        // 拿到xml字符串模板
        const str = this.XmlData;
        // 创建x2js实例
        const x2js = new X2JS({ attributePrefix: '$_' });
        // 将xml字符串模板转为json
        canvasInfo = x2js.xml2js(str);
      } else {
        canvasInfo = this.transformToJson(this.XmlData);
      }

      // 将canvas画板的宽高提高4倍，解决原始尺寸造成的文字模糊问题
      function computeSize(originSize) {
        return Number(originSize) * 8;
      }

      let drawData = [];
      if (!canvasInfo.C.I) {
        this.$emit('cancel', 'ContentError');
        this.messageBox.close();
        return;
      }

      if (Array.isArray(canvasInfo.C.I)) {
        drawData = canvasInfo.C.I;
      } else {
        drawData.push(canvasInfo.C.I);
      }
      const _this = this;
      let markNum = 0;
      let canvasBgColorX = 0;
      let canvasBgColorY = 0;
      let canvasBgWidth = computeSize(canvasInfo.C.$_w);
      let canvasBgHeight = computeSize(canvasInfo.C.$_h);

      this.imageWidth = canvasInfo.C.$_w;
      this.imageHeight = canvasInfo.C.$_h;


      // 创建canvas节点
      const c = document.createElement('canvas');

      c.width = computeSize(canvasInfo.C.$_w);
      c.height = computeSize(canvasInfo.C.$_h);
      const ctx = c.getContext('2d');

      function drawBg(x, y, w, h) {
        canvasBgColorX = computeSize(x);
        canvasBgColorY = computeSize(y);
        canvasBgWidth = computeSize(w);
        canvasBgHeight = computeSize(h);
      }

      // 根据xml数据旋转角度，并移动原点坐标
      if (canvasInfo.C.$_f === '1') {
        ctx.rotate(90 * Math.PI / 180);
        ctx.translate(0, -computeSize(canvasInfo.C.$_h));
        drawBg(
          0, 0,
          canvasInfo.C.$_h,
          canvasInfo.C.$_w * 2,
        );
      } if (canvasInfo.C.$_f === '2') {
        ctx.rotate(180 * Math.PI / 180);
        ctx.translate(-computeSize(canvasInfo.C.$_w), -computeSize(canvasInfo.C.$_h));
        drawBg(
          0, 0,
          canvasInfo.C.$_w,
          canvasInfo.C.$_h,
        );
      } if (canvasInfo.C.$_f === '3') {
        ctx.rotate(270 * Math.PI / 180);
        ctx.translate(-computeSize(canvasInfo.C.$_w), 0);
        drawBg(
          -canvasInfo.C.$_w,
          0,
          canvasInfo.C.$_h * 2,
          canvasInfo.C.$_w,
        );
      }

      // 画canvas底色
      ctx.fillStyle = '#fff';
      ctx.fillRect(canvasBgColorX, canvasBgColorY, canvasBgWidth, canvasBgHeight);

      // 画图片资源
      function imgDraw(item, callback) {
        if (!item.__text) {
          callback && callback();
          return;
        }

        let textValue = item.__text;

        if (textValue.indexOf('data:image') <= -1) {
          textValue = `data:image/png;base64,${item.__text}`;
        }
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = textValue;

        img.onload = () => {
          ctx.drawImage(
            img, computeSize(item.$_x),
            computeSize(item.$_y),
            computeSize(item.$_w),
            computeSize(item.$_h),
          );
          callback && callback();
        };
      }

      // 画文字
      function textDraw(item, callback) {
        // 避免字体过小造成打印字体模糊
        const fontSize = Number(item.$_si) < 10 ? 10 : Number(item.$_si);

        ctx.font = `normal normal 600 ${computeSize(fontSize) + 10}px ${item.$_f || '微软雅黑'}`;
        ctx.fillStyle = '#000';

        ctx.fillText(
          `${item.__text || ''}`,
          computeSize(item.$_x), computeSize(item.$_y) + 10,
        );
        callback && callback();
      }

      function transferOverLength(val, maxlength) {
        const arr = [];
        const lines = val.split('\n');

        for (let li = 0; li < lines.length; li++) {
          const str = String(lines[li]);
          let bytesCount = 0;
          let s = '';
          for (let i = 0, n = str.length; i < n; i++) {
            const charts = str.charCodeAt(i);
            // 统计字符串的字符长度
            if ((charts >= 0x0001 && charts <= 0x007e) || (charts >= 0xff60 && charts <= 0xff9f)) {
              bytesCount += 1;
            } else {
              bytesCount += 2;
            }
            // 换行
            s += str.charAt(i);
            if (bytesCount >= maxlength || i === n - 1) {
              arr.push(s);
              // 重置
              s = '';
              bytesCount = 0;
            }
          }
        }
        return arr;
      }

      // 画换行多行文字
      function mutipleTextDraw(item, callback) {
        const fontSize = Number(item.$_si) < 10 ? 10 : Number(item.$_si);
        const lines = transferOverLength(item.__text, item.$_w / fontSize * 1.8);
        if (lines.length > 1) {
          ctx.font = `normal normal 600 ${computeSize(fontSize) + 10}px ${item.$_f || '微软雅黑'}`;
          ctx.fillStyle = '#000';
          for (let i = 0; i < lines.length; i++) {
            // 避免字体过小造成打印字体模糊
            ctx.fillText(
              `${lines[i] || ''}`,
              computeSize(item.$_x), computeSize(item.$_y) + computeSize(i * fontSize * 1.5),
            );
          }
          callback && callback();
        } else {
          textDraw(item, callback);
        }
      }

      // 画二维码资源
      function imgQrcode(item, callback) {
        const subStr = new RegExp('__ych__', 'ig');// 创建正则表达式对象,不区分大小写,全局查找
        const result = item.__text.replace(subStr, '&');// 将__ych__全部替换成&

        _this.qrcodeText = `${result}`;
        _this.qrcodeSize = computeSize(item.$_x);
        _this.$nextTick(() => {
          ctx.drawImage(
            _this.$refs.qrcodeCanvas.$el.children[0],
            computeSize(item.$_x),
            computeSize(item.$_y),
            computeSize(item.$_w),
            computeSize(item.$_h),
          );
          callback && callback();
        });
      }

      // 按操作顺序执行异步队列
      function outQuent() {
        markNum++;
        if (markNum - 1 >= drawData.length) {
          const base64 = c.toDataURL('image/jpeg');
          // 开始打印相关的操作
          _this.printRender(base64);
          return;
        }

        if (drawData[markNum - 1].$_t === 'DynamicImageItem') {
          imgDraw(drawData[markNum - 1], outQuent);
        } else if (drawData[markNum - 1].$_t === 'DynamicQRCodeItem') {
          imgQrcode(drawData[markNum - 1], outQuent);
        } else if (drawData[markNum - 1].$_t === 'TextItem') {
          mutipleTextDraw(drawData[markNum - 1], outQuent);
        } else {
          textDraw(drawData[markNum - 1], outQuent);
        }
      }

      outQuent();
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
