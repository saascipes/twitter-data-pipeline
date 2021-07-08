import { MutationTree } from 'vuex';
import { CoreState } from '@/store/types';
import { Topic } from './types';

// You can't invoke mutations from other mutations via Vuex but you can directly invoke them
import {mutations as coreMutations} from '@/store/core/mutations';

export const mutations: MutationTree<CoreState> = {  
  addModels(state: CoreState, models: Topic[]){
    coreMutations.addModels(state, models);
  },

  select(state: CoreState, model: Topic){
    coreMutations.select(state, model);
  },

  update(state: CoreState, model: Topic){
    coreMutations.update(state, model);
  },

  updateSelectedCopy(state: CoreState, updated: Topic){    
    coreMutations.updateSelectedCopy(state, updated);
  },

  delete(state: CoreState, model: Topic) {    
    coreMutations.delete(state, model);
  }
};