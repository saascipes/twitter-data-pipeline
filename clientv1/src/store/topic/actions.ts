import { ActionTree } from 'vuex';
import { actions as coreActions } from '@/store/core/actions';
import { CoreState, RootState, Model } from '@/store/types';
import { Topic } from './types';

export const actions: ActionTree<CoreState, RootState> = {  
  
  save({commit, state, dispatch}, model?: Topic) : Promise<Model> {
    return coreActions.save({commit, state, dispatch}, model);
  },
  
  fetchModel({commit, state}, id: string): Promise<Model>{
    return coreActions.fetchModel({commit, state}, {id});
  },

  fetchModels({commit, state}, {ids, preCommit}:{ids: string[], preCommit?: Function}): Promise<Model[]>{
    return coreActions.fetchModels({commit, state}, {ids, preCommit});
  },

  fetchModelsByFilter({commit, state}, {filter, preCommit}: {filter?: string, preCommit?: Function} = {}): Promise<Model[]>{
    return coreActions.fetchModelsByFilter({commit, state}, {filter, preCommit});
  },

  delete({commit, state}, model?: Topic): Promise<void> {
    if(!model){
      throw 'Tried to delete a model but the stores selected copy was not set';
    }

    state.storeUtils.deleteById(model.id);
    return Promise.resolve(commit('delete', model));
  },

  select({commit, state, dispatch}, model: Topic): Promise<Model|undefined> {
    return coreActions.select({commit, state}, model);
  },

  updateSelectedCopy({commit, state}, updated: Model): Promise<Model|undefined> {
    return coreActions.updateSelectedCopy({commit, state}, updated);
  }
  
};