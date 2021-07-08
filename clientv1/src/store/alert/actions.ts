import { ActionTree } from 'vuex';
import { RootState, Model } from '@/store/types';
import { AlertStore, SgAlert } from './types';

export const actions: ActionTree<AlertStore, RootState> = {  
  
  addAlert({commit, state}, alert: SgAlert): void {
    commit('addModels', [alert]);
  }
  
};