import { MutationTree } from 'vuex';
import { CoreState } from '@/store/types';
import { Rule } from './types';

// You can't invoke mutations from other mutations via Vuex but you can directly invoke them
import {mutations as coreMutations} from '@/store/core/mutations';

export const mutations: MutationTree<CoreState> = {  
  addModels(state: CoreState, models: Rule[]){
    coreMutations.addModels(state, models);
  },

  select(state: CoreState, model: Rule){
    coreMutations.select(state, model);
  },

  update(state: CoreState, model: Rule){
    coreMutations.update(state, model);
  },

  updateSelectedCopy(state: CoreState, updated: Rule){    
    coreMutations.updateSelectedCopy(state, updated);
  },

  delete(state: CoreState, model: Rule) {    
    coreMutations.delete(state, model);
  }
};