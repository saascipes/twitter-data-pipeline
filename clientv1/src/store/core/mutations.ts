import { MutationTree } from 'vuex';
import { CoreState, Model } from '@/store/types';
import _ from 'lodash';
import Vue from 'vue';

export const mutations: MutationTree<CoreState> = {  
  
  // Add models to the store
  // Do not add any models that are already in the store - keyed off of the model.id
  addModels(state: any, models: object[]){
    const newModels = models.filter((model: any) => !state.storeUtils.findById(model.id));
    state.models.push(...newModels);
  },

  select(state, model: Model){
    state.selected = model;
    state.selectedCopy = _.cloneDeep(state.selected);
  },
  
  update(state: any, updated: Model) {
    const existing = state.storeUtils.findById(updated.id);    
    if(!existing){
      throw `Tried to update a store model that was null. ${JSON.stringify(updated)}`;
    }
    else {
      // Object.assign(existing, updated);
      for (let key in updated) {
        if(!existing.hasOwnProperty(key)) {
          Vue.set(existing, key, updated[key]);
        } else {
          existing[key] = updated[key];
        }
      }
    }
  },

  updateSelectedCopy(state, updated: Model){
    if(!state.selectedCopy){
      throw `Tried to update a store selectedCopy that was null. value=${JSON.stringify(updated)}`;
    }
    else {            
      for (let key in updated) {
        
        // Uncomment on Vue 3 upgrade finished!
        // This code creates temporary objects to hold the nested reactive structures if they don't exist yet
        let currentObject = state.selectedCopy;
        key.split('.').forEach(keyPart => {
          if(!currentObject.hasOwnProperty(keyPart)){            
            const tmpNestedObject:any = {keyPart: undefined};
            Vue.set(currentObject, keyPart, tmpNestedObject);
            currentObject = tmpNestedObject;            
          }
          else {
            currentObject = currentObject[keyPart];
          }
        });

        _.set(state.selectedCopy, key, updated[key]);
      }
    }
  },

  delete(state, model: Model) {
    if(!state.storeUtils){
      throw 'Invoked core store delete for a store that had not utils defined';
    }

    // Doing this manually is faster than _.remove because it stops at the first item found
    const deleteIndex = state.storeUtils.findIndexById(model.id);
    if(deleteIndex !== -1){
      state.models.splice(deleteIndex, 1);
    }

    // select another model if deleteMe was the selected one
    if(state.selected && state.selected.id === model.id && state.models.length > 0){
      state.selected = state.models[0];
      state.selectedCopy = _.cloneDeep(state.selected);
    }
  }

};