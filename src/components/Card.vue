<template>
  <div
    v-if="verb"
    class="card has-text-centered"
  >
    <div class="card-content">
      <p class="title">
        {{ verb }}
        <!-- {{ verb.prefix }} {{ verb.prefix ? verb.person.name : verb.person.label }} {{ verb.auxiliary }} {{ verb.verb }}         -->
      </p>
      <p class="subtitle">
        <!-- {{ verb.translation.english.join(', ') }} -->
      </p>
    </div>
    <footer class="card-footer">
      <p class="card-footer-item">
        <span>
          View on <a href="https://twitter.com/codinghorror/status/506010907021828096">Twitter</a>
        </span>
      </p>
      <p class="card-footer-item">
        <span>
          Share on <a href="#">Facebook</a>
        </span>
      </p>
    </footer>
  </div>  
</template>

<script>

import { mapState, mapGetters } from 'vuex';

export default {
  name: 'Card',
  // props: {
  //   verb: {
  //     type: Object,
  //     default () {
  //       return {};
  //     },
  //   },
  // },
  computed: {
    ...mapState({}),
    ...mapGetters({
      verb: 'getCurrentRunVerb',
    }),
  },
};
</script>

<style scoped lang="scss">
.card {
  min-height: 100%;
  height: 100%;
}
.verb-ending {
  color: blue;
}
</style>
