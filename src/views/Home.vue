<template>
  <div
    id="home"
    class="section"
  >
    <div class="columns">
      <div class="column has-text-centered">
        <h1 class="title">
          Verbs Practice
        </h1>
        <h2 class="subtitle">
          Settings
        </h2>
        <div class="field">
          <multiselect
            v-model="selectedVerbs"
            v-bind="mselectVerbs.options"
            :options="verbs"
          />
        </div>
        <div class="field">
          <multiselect
            v-model="selectedTenses"
            v-bind="mselectTenses.options"
            :options="tenses"
          />
        </div>
        <div class="field">
          <button
            class="button is-primary is-fullwidth"
            @click="start"
          >
            Start
          </button>
        </div>
      </div>      
    </div>
    <div class="columns">
      <div class="column">
        <div
          v-for="conjInfo in conjugations"
          :key="conjInfo.tense.name"
        >
          <h3 class="is-size-3">
            {{ conjInfo.tense.label }}
          </h3>
          <div
            v-for="conj in conjInfo.conjugation"
            :key="`${conj.person.name}-${conj.verb}`"
          >
            {{ conj.prefix }} {{ conj.prefix ? conj.person.name : conj.person.label }} {{ conj.auxiliary }} {{ conj.verb }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import Vue from 'vue';
import Multiselect from 'vue-multiselect';
import 'vue-multiselect/dist/vue-multiselect.min.css';
import { mapState } from 'vuex';

Vue.component('multiselect', Multiselect);

export default {
  name: "Home",
  components: {
    Multiselect,
  },
  data () {
    return {
      conjugations: [],
      selectedVerbs: [],   
      mselectVerbs: {
        options: {
          multiple: true,
          placeholder: "Select Verbs",
          closeOnSelect: false,
          customLabel: this.infinitiveVerb,
          trackBy: 'base',
        },
      },
      selectedTenses: [],   
      mselectTenses: {
        options: {
          multiple: true,
          placeholder: "Select Tenses",
          closeOnSelect: false,
          label: "label",
          trackBy: "name",
          groupLabel: "type",
          groupValues: "tenses",
          groupSelect: true,
          limit: 10,
        },
      },
    };
  },
  computed: {
    // ...mapGetters({
    //   verbsNames: 'getVerbsNames',
    //   tensesNames: 'getTensesNames',
    // }),
    ...mapState({
      'tenses': 'tenses',
      'verbs': 'verbs',
    }),
  },
  watch: {
  },
  created () {

  },
  methods: {
    infinitiveVerb ({ base, infinitive }) {
      return `${base}${infinitive}`;
    },
    async start () {
      console.log(this.selectedTenses);
      let settings = {
        selectedVerbs: this.selectedVerbs,
        selectedTenses: this.selectedTenses,
      };
      
      let start = await this.$store.dispatch('startRun', settings);
      console.log('start', start);

      if (start) {
        this.conjugations = start;
        // this.$router.push({ name: 'run' });
      } else {
        console.error('There was an issue starting');
      }
    },
  },
};
</script>