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
    currentRun: {
      verbs: [],
    },
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
    getCurrentRunVerb (state) {
      if (state.currentRun && state.currentRun.verbs.length > 0) {
        return state.currentRun.verbs[Math.floor(Math.random() * state.currentRun.verbs.length)];
      }
      return [];
    },
  },
  mutations: {
    setSettings(state, settings) {
      state = Object.assign(state, settings);
    },
    setVerbs(state, verbs) {
      Vue.set(state, 'verbs', verbs);
    },
    setCurrentRunVerbs(state, verbs) {
      Vue.set(state.currentRun, 'verbs', verbs);
    },
  },
  actions: {
    async fetchVerbsData ({ commit }) {
      try {
        let settings = await axios.get('settings.json');
        let verbi = await axios.get('verbi.json');
        try {
          if (settings.data) {
            console.log(settings.data);
            commit('setSettings', settings.data);
          } else {
            throw ("No data found");
          }
          if (verbi.data) {
            console.log(verbi.data);
            commit('setVerbs', verbi.data);
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
    async startRun ({ dispatch, commit }, { selectedVerbs, selectedTenses }) {      
      let verbsAndTenses = await dispatch('prepRun', { selectedVerbs, selectedTenses });      
      let run = await dispatch('makeRun', verbsAndTenses);      
      commit('setCurrentRunVerbs', run);
      return true;
    },   
    prepRun ({ state }, { selectedVerbs, selectedTenses }) {

      let verbs = selectedVerbs;
      let tenses = selectedTenses;

      if (selectedVerbs.length === 0) {
        verbs = state.verbs;
      }

      if (selectedTenses.length === 0) {
        tenses = state.tenses;
      }

      return { 
        'verbs': verbs, 
        'tenses': tenses,
      };

    },
    async makeRun ({ dispatch }, { verbs, tenses }) {
    
      let response = [];

      // let conjugate = 'all'; //one, tense

      // if (conjugate === 'one') {
      //   let verb = verbs[Math.floor(Math.random() * verbs.length)];
      //   console.log('makeRun random verb', verb);
      //   let tense = tenses[Math.floor(Math.random() * tenses.length)];
      //   console.log('makeRun random tense', tense);
      //   console.log('make run conjugate one');
      //   let person = state.persons[Math.floor(Math.random() * state.persons.length)];
      //   console.log('makeRun random person', person.name);
      //   response = await dispatch('conjugate', { verb, tense, person });
      // }

      // if (conjugate === 'all') {        
      response = await dispatch('conjugateAllPersons', { verbs, tenses });
      // }

      return response;
    },
    async conjugate({ dispatch }, { verb, tense, person }) {
      const tenseFunc = 'conj' + tense.name.split('-').map(tense => tense.charAt(0).toUpperCase() + tense.slice(1)).join('');

      const tenseMap = [
        'conjTempiCompostiPassatoProssimo',
        'conjTempiCompostiTrapassatoProssimo',
        'conjTempiCompostiTrapassatoRemoto',
        'conjTempiCompostiFuturoAnteriore',
        'conjCongiuntivoPassato',
        'conjCongiuntivoTrapassato',
        'conjCondizionalePassato',
      ];

      let response = [];      

      response.person = person;

      if (tense.name.startsWith('congiuntivo')) {
        response.prefix = 'Che';
      }

      if (tenseMap.includes(tenseFunc)) {
        response.auxiliary = await dispatch(tenseFunc, { verb, tense, person });        
        response.auxiliaryInfinitive = verb.auxiliary;
      }
      
      let verbEnding = await dispatch('getVerbEnding', { verb, tense, person });        

      if (!verbEnding.isIrregular) {
        response.verb = `${verb.base}${verbEnding.ending}`;        
      } else {
        response.verb = verbEnding.ending;
      }

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
            let conj = await dispatch('conjugate', { verb, tense, person });
            conjInfo['conjugation'].push(conj);
          });
        });
        response.push(conjInfo);
      });

      console.log('conjugateAll response', response);
      
      return response;

    },
    async getAuxiliaryVerb ({ state, dispatch, getters }, { person, tense, auxiliaryVerb }) {
      let auxiliary = state.verbs.find(verb => `${verb.base}${verb.infinitive}` === auxiliaryVerb);
      let auxiliaryInfo = { 
        verb: auxiliary,
        tense: getters['getTenseByName'](tense),
        person,
      };
      let auxiliaryConjugate = await dispatch('conjugate', auxiliaryInfo);      
      return auxiliaryConjugate.verb;
    },
    async conjTempiCompostiPassatoProssimo ({ dispatch }, { verb, person }) {      
      let auxVerb = await dispatch('getAuxiliaryVerb', { person, tense: 'indicativo-presente', auxiliaryVerb: verb.auxiliary });
      return auxVerb;
    },
    async conjTempiCompostiTrapassatoProssimo ({ dispatch }, { verb, person }) {
      let auxVerb = await dispatch('getAuxiliaryVerb', { person, tense: 'indicativo-imperfetto', auxiliaryVerb: verb.auxiliary });      
      return auxVerb;
    },
    async conjTempiCompostiTrapassatoRemoto ({ dispatch }, { verb, person }) {
      let auxVerb = await dispatch('getAuxiliaryVerb', { person, tense: 'indicativo-passato-remoto', auxiliaryVerb: verb.auxiliary });      
      return auxVerb;
    },
    async conjTempiCompostiFuturoAnteriore ({ dispatch }, { verb, person }) {
      let auxVerb = await dispatch('getAuxiliaryVerb', { person, tense: 'indicativo-futuro-semplice', auxiliaryVerb: verb.auxiliary });
      return auxVerb;      
    },
    async conjCongiuntivoPassato ({ dispatch }, { verb, person }) {
      let auxVerb = await dispatch('getAuxiliaryVerb', { person, tense: 'congiuntivo-presente', auxiliaryVerb: verb.auxiliary }); 
      return auxVerb;     
    },
    async conjCongiuntivoTrapassato ({ dispatch }, { verb, person }) {
      let auxVerb = await dispatch('getAuxiliaryVerb', { person, tense: 'congiuntivo-imperfetto', auxiliaryVerb: verb.auxiliary });
      return auxVerb;
    },
    async conjCondizionalePassato ({ dispatch }, { verb, person }) {
      let auxVerb = await dispatch('getAuxiliaryVerb', { person, tense: 'condizionale-presente', auxiliaryVerb: verb.auxiliary });
      return auxVerb;  
    },
    getVerbEnding ({ state }, { verb, tense, person }) {
      let ending = '';
      let isIrregular = false;
      let isIre2 = false;
      
      let tenseName = state.rules[verb.infinitive][tense.name];
            
      //If has ireggular tense, use it
      if (verb.irregularCases && verb.irregularCases[tense.name] && (verb.irregularCases[tense.name][person.name] || typeof verb.irregularCases[tense.name] === "string" || Array.isArray(verb.irregularCases[tense.name]))) {
        tenseName = verb.irregularCases[tense.name];
        isIrregular = true;
      }

      //catch for ire2 verbs
      if (
        !isIrregular
        && verb.infinitive === 'ire'
        && (tense.name === 'congiuntivo-presente' || tense.name === 'indicativo-presente')
        && [ 'a', 'e', 'i', 'o', 'u' ].includes(verb.base.slice(1, -1))
        && [ 'io', 'tu', 'lui', 'loro' ].includes(person.name)
      ) {
        tenseName = state.rules['ire2'][tense.name];      
        isIre2 = true;
      }

      //Ending exception for Condizionale Presente
      if (tense.name === 'condizionale-presente' && !isIrregular && !isIre2) {
        let tempInfinitive = verb.infinitive;
        if (verb.infinitive === 'are') {
          tempInfinitive = 'ere';
        }
        ending = `${tempInfinitive.slice(0, -1)}${state.rules[verb.infinitive][tense.name][person.name]}`;        
      } else {

        //If String then ending is the same for all persons        
        if (typeof tenseName === 'string') {
          ending = tenseName;
        } else {
          //Else ending changes per person            
          if (typeof tenseName[person.name] === 'string') {
            //has one ending
            ending = tenseName[person.name];
          }else if (Array.isArray(tenseName)) {
            //Has alternative verb
            ending = tenseName.join(' / ');
          } else {
            //Has alternative verb ending
            ending = tenseName[person.name].join(' / ');
          }
        }
      }
      return { isIrregular, ending };
    },
  },
});
