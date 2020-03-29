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
  getters: {
    getTenseByName: (state) => (tenseName) => {
      for (let tI=0; tI < state.tenses.length; tI++) {        
        for (let i=0; i < state.tenses[tI].tenses.length; i++) {
          if (state.tenses[tI].tenses[i].name === tenseName) {            
            return state.tenses[tI].tenses[i];
          }           
        }
      }
    },
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

      let conjugate = 'all'; //one, tense

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

      console.log(tenseFunc, '<------');

      const tenseMap = [
        'conjTempiCompostiPassatoProssimo',
        'conjTempiCompostiTrapassatoProssimo',
        'conjTempiCompostiTrapassatoRemoto',
        'conjTempiCompostiFuturoAnteriore',
        'conjCongiuntivoPassato',
        'conjCongiuntivoTrapassato',
      ];

      let response = [];      

      response.person = person;

      if (tense.name.startsWith('congiuntivo')) {
        response.prefix = 'Che';
      }

      if (tenseMap.includes(tenseFunc)) {
        response.auxiliary = await dispatch(tenseFunc, { verb, tense, person });        
      }
      
      const isIrregular = await dispatch('checkIrregularCases', { verb, tense, person });

      if (isIrregular) {
        response.verb = isIrregular;
      } else {
        console.log('is NOT irregular case');
        let ending = '';
        
        if (typeof state.rules[verb.infinitive][tense.name] === 'string') {
          ending = state.rules[verb.infinitive][tense.name];
        } else {
          if (typeof state.rules[verb.infinitive][tense.name][person.name] === 'string') {
            ending = state.rules[verb.infinitive][tense.name][person.name];
          } else {
            ending = state.rules[verb.infinitive][tense.name][person.name].join(' /');
          }
        }
        
        response.verb = `${verb.base}${ending}`;
      }
      
      console.log(response, 'conjugate response');

      return response;

    },
    async conjugateAllPersons({ dispatch, state }, { verbs, tenses }) {
      
      let response = [];

      await asyncForEach(tenses, async (tense) => {        
        let conjInfo = {
          tense: tense,
          conjugation: [],
        };
        await asyncForEach(verbs, async (verb) => {
          await asyncForEach(state.persons, async (person) => {            
            conjInfo['conjugation'].push(await dispatch('conjugate', { verb, tense, person }));
          });
        });
        response.push(conjInfo);
      });

      console.log('conjugateAll response', response);
      
      return response;

    },
    async getAuxiliaryVerb ({ state, dispatch, getters }, { person, tense }) {
      let auxiliary = state.verbs.find(verb => `${verb.base}${verb.infinitive}` === verb.auxiliary);
      let auxiliaryInfo = { 
        verb: auxiliary,
        tense: getters['getTenseByName'](tense),
        person,
      };
      let auxiliaryConjugate = await dispatch('conjugate', auxiliaryInfo);
      console.log(auxiliaryConjugate.verb, '<--------');
      return auxiliaryConjugate.verb;
    },
    async conjTempiCompostiPassatoProssimo ({ dispatch }, { person }) {
      return await dispatch('getAuxiliaryVerb', { person, tense: 'indicativo-presente' });      
    },
    async conjTempiCompostiTrapassatoProssimo ({ dispatch }, { person }) {
      return await dispatch('getAuxiliaryVerb', { person, tense: 'indicativo-imperfetto' });      
    },
    async conjTempiCompostiTrapassatoRemoto ({ dispatch }, { person }) {
      return await dispatch('getAuxiliaryVerb', { person, tense: 'indicativo-passato-remoto' });      
    },
    async conjTempiCompostiFuturoAnteriore ({ dispatch }, { person }) {
      return await dispatch('getAuxiliaryVerb', { person, tense: 'indicativo-futuro-semplice' });      
    },
    async conjCongiuntivoPassato ({ dispatch }, { person }) {
      return await dispatch('getAuxiliaryVerb', { person, tense: 'congiuntivo-presente' });      
    },
    async conjCongiuntivoTrapassato ({ dispatch }, { person }) {
      return await dispatch('getAuxiliaryVerb', { person, tense: 'congiuntivo-imperfetto' });      
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
