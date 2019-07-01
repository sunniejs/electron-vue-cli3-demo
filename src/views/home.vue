<template>
  <div>
    <PrintWebView />
  </div>
</template>

<script>
import PrintWebView from '@/components/PrintWebView'
export default {
  name: "landing-page",
  components: { PrintWebView },
  data() {
    return {
      print0: "",
      print1: "",
      xmlTemplate: ''
    };
  },
  mounted() {
  },
  methods: {
  }
};
</script>

<style>
</style>
