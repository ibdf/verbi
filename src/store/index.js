import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';

Vue.use(Vuex);

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export default new Vuex.Store({
  state: {
    verbs: [],
    tenses: [],
    persons: [],
    rules: {},
  },
  mutations: {
    setSettings(state, settings) {
      state = Object.assign(state, settings);
    },
  },
  actions: {
    async fetchVerbsData ({ commit }) {
      try {
        let settings = await axios.get('settings.json');
        try {
          if (settings.data) {
            console.log(settings.data);
            commit('setSettings', settings.data);
          } else {
            throw ("No data found");
          }
        } catch (e) {
          console.error(e);
        }
      } catch (e) {
        console.error(e);
      }
    },
    async startRun ({ dispatch }, { selectedVerbs, selectedTenses }) {
      console.log('startRun selectedVerbs', selectedVerbs);
      console.log('startRun selectedTenses', selectedTenses);
      let verbsAndTenses = await dispatch('prepRun', { selectedVerbs, selectedTenses });      
      let run = await dispatch('makeRun', verbsAndTenses);
      console.log('run', run);
      return run;
    },
    
    prepRun ({ state }, { selectedVerbs, selectedTenses }) {

      console.log('prerun has started');
      console.log('preprun selectedVerbs', selectedVerbs);
      console.log('preprun selectedTenses', selectedTenses);
      let verbs = selectedVerbs;
      let tenses = selectedTenses;

      if (selectedVerbs.length === 0) {
        verbs = state.verbs;
      }

      if (selectedTenses.length === 0) {
        tenses = state.tenses;
      }

      console.log('prerun verbs', verbs);
      console.log('prerun tenses', tenses);
      console.log('----------------------');

      return { 
        'verbs': verbs, 
        'tenses': tenses,
      };

    },
    async makeRun ({ dispatch, state }, { verbs, tenses }) {

      console.log('makeRun has started');
      console.log('makeRun verbs', verbs);
      console.log('makeRun tenses', tenses);      
      
      let response = [];

      let conjugate = 'one'; //one, tense

      if (conjugate === 'one') {
        let verb = verbs[Math.floor(Math.random() * verbs.length)];
        console.log('makeRun random verb', verb);
        let tense = tenses[Math.floor(Math.random() * tenses.length)];
        console.log('makeRun random tense', tense);
        console.log('make run conjugate one');
        let person = state.persons[Math.floor(Math.random() * state.persons.length)];
        console.log('makeRun random person', person.name);
        response = await dispatch('conjugate', { verb, tense, person });
      }

      if (conjugate === 'all') {
        console.log('makeRun conjugate all');
        response = await dispatch('conjugateAllPersons', { verbs, tenses });
      }

      return response;
    },
    async conjugate({ state, dispatch }, { verb, tense, person }) {
      const tenseFunc = 'conj' + tense.name.split('-').map(tense => tense.charAt(0).toUpperCase() + tense.slice(1)).join('');

      const tenseMap = [
        'conjTempiCompostiPassatoProssimo',
      ];

      let response = [];      

      response.push(person.label);

      if (tenseMap.includes(tenseFunc)) {
        response.push(await dispatch(tenseFunc, { verb, tense, person }));        
      }
      
      const isIrregular = await dispatch('checkIrregularCases', { verb, tense, person });

      if (isIrregular) {
        response.push(isIrregular);
      } else {
        console.log('is NOT irregular case');
        response.push(`${verb.base}${state.rules[verb.infinitive][tense.name][person.name]}`);
      }
      
      console.log(response, 'response');

      return response;

    },
    async conjugateAllPersons({ dispatch, state }, { verbs, tenses }) {
      
      let response = [];

      tenses.forEach(tense => {
        verbs.forEach(async verb => {
          await asyncForEach(state.persons, async (person) => {
            response.push(await dispatch('conjugate', { verb, tense, person }));
          });
        });
      });

      console.log('conjugateAll response', response);
      
      return response;

    },
    conjTempiCompostiPassatoProssimo ({ state }, { person }) {
      let auxiliary = state.verbs.find(verb => `${verb.base}${verb.infinitive}` === verb.auxiliary);
      return auxiliary.irregularCases['indicativo-presente'][person.name];      
    },
    checkTrapassatoProssimo ({ state }, { tense, person }) {
      console.log('here');
      let response = [];
      if (tense.name === 'trapassato-prossimo') {
        console.log('is trapassato-prossimo');
        let auxiliary = state.verbs.find(verb => `${verb.base}${verb.infinitive}` === verb.auxiliary);
        if (auxiliary) {
          console.log('auxiliary',auxiliary );
          response.push(auxiliary.irregularCases.imperfetto[person.name]);
          console.log('auxiliary verb', response);
        }
      }
      return response;
    },
    checkIrregularCases ({ state }, { verb, tense, person }) {      
      if (verb.irregularCases && verb.irregularCases[tense.name] && verb.irregularCases[tense.name][person.name]) {
        console.log('is irregular case');
        return `${verb.irregularCases[tense.name][person.name]}`;
      } 
      return false;
    },
  },
  modules: {
  },
});
