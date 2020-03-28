<template>
  <div id="app">
    <main>
      <div class="container">
        <div class="columns">
          <div class="column">
            <router-view />
          </div>
        </div>
      </div>
    </main>
    <!-- <card
      v-bind="{ verb: verbs[0] }"
    /> -->
  </div>
</template>
<script>
// import { mapState } from 'vuex';
// import card from './components/Card';

export default {
  name: "App",
  components: {
    // card,
  },
  data () {
    return {
      
    };
  },
  computed: {
    // ...mapState({
    //   verbs:
    //     'verbs',
    // }),
  },
  async created () {
    await this.$store.dispatch("fetchVerbsData");
  },
};
</script>
<style>
  body, html, #app {
    min-height: 100%;
    height: 100%;
  }
</style>

      