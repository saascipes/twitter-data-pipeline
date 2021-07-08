import { Commit, Dispatch } from 'vuex';
import { CoreState, Model } from '@/store/types';
import { initStompHandler, InitStompOptions } from '@/utils/StompHandler';
import { SgAlert, AlertPlacement, AlertCategory } from '@/store/alert/types';

import { StoreType } from '../types';
import store from '../index';
import axios from 'axios';
import lodash from 'lodash';

// For pagination, what are the defaults for max models loaded, the default page size etc.
const DEFAULT_MAX_PAGE_TOTAL = 3000;
const DEFAULT_MAX_PAGE_SIZE = 500;


// Helper functions
const createFilterUrlParams = function(filter?: string, lastId?: string): string{
  let params: string = `limit=${DEFAULT_MAX_PAGE_SIZE}`;

  // don't include filter unless it's a non empty string
  if(filter){
    params += `&filter=${filter}`;
  }
  if(lastId){
    params += `&lastId=${lastId}`;
  }

  return params;
};


// export const startApp = function({commit, state}){
  // if(state.appStarted){
  //   throw 'Error, the app has already been started.  On logout, you should have refreshed the app.'
  // }
  
export const startApp = function(){
  // Initialize the single stomp handler
  const stompOptions: InitStompOptions = { 
    store,
    url: process.env.VUE_APP_RABBITMQ_URL, // url (localhost for local)
    login: process.env.VUE_APP_RABBITMQ_USER, // login
    passcode: process.env.VUE_APP_RABBITMQ_PASS, // passcode
    vHost: process.env.VUE_APP_RABBITMQ_VHOST, // vHost
    exchangeName: 'twitter-data-pipeline', // exchangeName
    queueName: process.env.VUE_APP_RABBITMQ_QUEUE // queueName
  };

  const stompHandler = initStompHandler( stompOptions );
  try {
    stompHandler.connect();
  }
  catch(err){
    store.dispatch(`${StoreType.AlertStore}/addAlert`, new SgAlert('Could not connect to browser push.', AlertPlacement.FOOTER, AlertCategory.ERROR));
    console.error('Error, could not connect to browser push.', err);
  }

  // Fetch all of the jrules
  store.dispatch(`${StoreType.RuleStore}/fetchModelsByFilter`);
  
  // commit('setAppStarted', true);
}


const loadPaginatedModels = async function({state, commit, preCommit, filter}: {state: CoreState, commit: Commit, preCommit?: Function, filter?: string}): Promise<object[]>{  
  const fetchedModels = [];

  let baseUrl = `${state._url('GET')}?`;

  if(state._responseFields){
    baseUrl += `responseFields=${state._responseFields()}&`;
  }

  const firstResponse: any = await axios.get(`${baseUrl}${createFilterUrlParams(filter)}`);
  fetchedModels.push(...firstResponse.data.data);
  // Allow a handler to perform a bulk load before data is commited to the store
  if(preCommit){
    // Do not await on the preCommit - it should immediately generate promises before invoking any await code to not block main thread
    preCommit(firstResponse);
  }

  commit(`${state._storeName}/addModels`, firstResponse.data.data, {root: true});

  // some models don't support pagination
  if(firstResponse.data.meta && firstResponse.data.meta.count){  
    const paginationTotal = firstResponse.data.meta.count;

    if(paginationTotal > DEFAULT_MAX_PAGE_TOTAL){
      console.error(`Oops, looks like you tried to bulk load a model type with more than the default limit of ${DEFAULT_MAX_PAGE_TOTAL}. url=${baseUrl}, totalModelCount=${paginationTotal}`);
    }
    else if(paginationTotal > DEFAULT_MAX_PAGE_SIZE) {

      let lastId = firstResponse.data.data[firstResponse.data.data.length - 1].id;
      for(let pageIndex = 1; pageIndex * DEFAULT_MAX_PAGE_SIZE < paginationTotal; pageIndex++){
        const response = await axios.get(`${baseUrl}${createFilterUrlParams(filter)}&lastId=${lastId}`);            
        fetchedModels.push(...response.data.data);
        if(preCommit){
          // Do not await on the preCommit - it should immediately generate promises before invoking any await code to not block main thread
          preCommit(response);
        }                        
        commit(`${state._storeName}/addModels`, response.data.data, {root: true});
        lastId = response.data.data[response.data.data.length - 1].id;
      };
    }
  }
  

  return fetchedModels;
};


// Normal debounce doesn't save debounced function arguments for later use (just the last function arguments)
// The fetchHandler needs to invoke the reset function to start debouncing over again
export class FetchModelDebouncer {
  private timer!: null|number;
  private readonly DEBOUNCE_DEFAULT_MS = 100;
  public ids!: string[];

  public reset(){
    this.timer = null;
    this.ids = [];
  }

  public fetchDebounced(fetchHandler: Function, id: string, debounceMS?: number){    
    if(!this.timer){      
      this.timer = setTimeout(fetchHandler, debounceMS || this.DEBOUNCE_DEFAULT_MS);
      this.ids = [];
    }
    else {
      clearTimeout(this.timer);
      this.timer = setTimeout(fetchHandler, debounceMS || this.DEBOUNCE_DEFAULT_MS);      
    }

    this.ids.push(id);
  }
}


export const actions = {  
  
  async save({commit, state, dispatch}, model: Model|undefined = state.selectedCopy) : Promise<Model> {
    if(!model){
      throw 'Tried to save a model but the stores selected copy was not set';
    }

    const isSelectedNewModel = state.selectedCopy && model.id === state.selectedCopy.id;
    let response: any;
    if(model.id){
      response = await axios.put(`${state._url('UPDATE')}/${model.id}`, model);
      // The api might have added calculated fields so it's best to update the store
      commit(`${state._storeName}/update`, response.data.data, {root: true});
    }
    else {
      response = await axios.post(state._url('CREATE'), model);
      commit(`${state._storeName}/addModels`, [response.data.data], {root: true});
    }    
    
    // Return the updated model in the store
    const updatedModel = await this.fetchModel({commit, state}, {id: model.id || response.data.data.id});

    // todo - rely on the stream API or rely on the return value from the POST/PUT?
    // or maybe we should unselect the model in this situation?
    // In any case, you can't use the old object that was selected - that reference is dead
    if(isSelectedNewModel){
      // This code simply updates the selected model with the real value that is now in the store
      await dispatch('select', updatedModel);
    }

    return updatedModel;
  },

  async delete({commit, state}: {commit: Commit, state: CoreState}, model: Model|undefined = state.selectedCopy): Promise<void> {    
    if(!model){
      throw 'Tried to delete a model but the stores selected copy was not set';
    }

    await axios.delete(`${state._url('DELETE')}/${model.id}`);
    commit('delete', model);
  },

  // Useful when a model is loaded many times individually in separate requests over a short period of time.  Aggregates many
  // calls into a single request using the -> API operator
  async fetchModelDebounced({commit, state}: {commit: Commit, state: CoreState}, {id, debounceMS}: {id: string, debounceMS?: number}): Promise<Model>{
    if(!state._fetchModelDebouncer){
      throw 'Invoked core store fetchModelDebounced for a store with no _fetchModelDebouncer';
    }
    const promiseKey = `${state._url('GET')}-${id}`;

    if(!state._promiseStore.get(promiseKey)){
      // Create the promise immediately. Resolved later in fetchAlerts
      state._promiseStore.create(promiseKey);

      if(!state._fetchModelDebouncer){
        state._fetchModelDebouncer = new FetchModelDebouncer();
      }

      // This will eventually be triggered for 1+ ids after debouncing for a period of time
      const fetchHandler = () => {
        if(!state._fetchModelDebouncer){
          throw 'Invoked core store fetchModelDebounced for a store with no utils';
        }        
        // save ids and reset state before invoking an async/await callback
        const clonedIds = lodash.clone(state._fetchModelDebouncer.ids);      
        state._fetchModelDebouncer.reset();
        
        this.fetchModels({commit, state}, {ids: clonedIds});
      }

      state._fetchModelDebouncer.fetchDebounced(fetchHandler, id, debounceMS);      
    }

    return state._promiseStore.get(promiseKey).promise;
  },

  async fetchModel({commit, state}:{commit: Commit, state: CoreState}, {id}:{id: string}): Promise<Model>{
    if(!state.storeUtils){
      throw 'Invoked core store fetchModel for a store with no utils';
    }

    const promiseKey = `${state._url('GET')}-${id}`;

    if(!state._promiseStore.get(promiseKey)){

      const fetchPromise = state._promiseStore.create(promiseKey);

      (async () => {
        if(!state.storeUtils){
          throw 'Invoked core store fetchModel  for a store with no utils';
        }
  
        let model = state.models.find((model: any) => model.id === id);

        if(!model){
          // If the model isn't in the state, fetch it async and then add it to the store
          try {
            const response = await axios.get(`${state._url('GET')}/${id}`);          
            commit(`${state._storeName}/addModels`, [response.data.data], {root: true});

            // Get the model just added to the store via commit (or added just before this code tried to add the model to the store)
            model = state.storeUtils.findById(id);
          }
          catch(err){
            fetchPromise.reject(err); // probably want better error handling
          }
        }

        fetchPromise.resolve(model);
      })();
    }

    return state._promiseStore.get(promiseKey).promise;
  },

  async fetchModels({commit, state}: {commit: Commit, state: CoreState}, {ids, preCommit}:{ids: string[], preCommit?: Function}): Promise<Model[]>{        
    return new Promise(async (resolve, reject) => {
      if(!state.storeUtils){
        throw 'Invoked core store fetchModels for a store with no utils';
      }

      const idsToFetch = [];
      
      // First generate promises for ids that don't have promises yet
      // And figure out if we've generated an API request for those ids
      for(const id of ids){       
        const promiseKey = `${state._url('GET')}-${id}`;

        if(!state._promiseStore.get(promiseKey)){
          state._promiseStore.create(promiseKey);
        }

        if(!state._promiseStore.get(promiseKey)._startedFetch){
          idsToFetch.push(id);
          state._promiseStore.get(promiseKey)._startedFetch = true;
        }
      }
      
      // If there are any ids to fetch then go get them from the API
      if(idsToFetch.length > 0){
        try {
          const filter = `${encodeURI(`id->[${idsToFetch}]`)}`;
          await loadPaginatedModels({state, commit, preCommit, filter});
          
          // resolve all of the individual promises per model
          idsToFetch.forEach((id: any) => {
            if(!state.storeUtils){
              throw 'Invoked core store fetchModels for a store with no utils';
            }
      
            // find the model in the store. The models we retrieved aren't necessarily
            // the models in the store due to other filter loading happening at the same time
            const model = state.storeUtils.findById(id);
            const promiseKey = `${state._url('GET')}-${id}`;

            if(model){
              state._promiseStore.get(promiseKey).resolve(model);
            }
            else {
              state._promiseStore.get(promiseKey).reject(`modelId=${id} not found for getUrl=${state._url('GET')}.`);
            }
          });
        }
        catch(err){
          // Need to log this
          reject(err);
        }
      }

      // Get all of the promises for each of the ids requested and wait until they are all resolved
      const loadPromises: Promise<any>[] = [];
      for(const id of ids){ 
        const promiseKey = `${state._url('GET')}-${id}`;
        loadPromises.push(state._promiseStore.get(promiseKey).promise);
      }

      // Resolve the promise when all of the models have been loaded
      resolve(await Promise.all(loadPromises));
    });
  },

  // BEWARE: the results from this function ARE NOT KEPT IN SYNC WITH Stream API!!
  // The first time you request models via a filter, the filter is passed to the API
  // All subsequent calls for the same filter use the same results.
  async fetchModelsByFilter({commit, state}: {commit: Commit, state: CoreState}, {filter, preCommit}:{filter?: string, preCommit?: Function}): Promise<Model[]>{
    if(!state.storeUtils){
      throw 'Invoked core store fetchModelsByFilter for a store with no utils';
    }

    const promiseKey = `${state._url('GET')}-${filter}`;

    // Only do a fetch if the promise hasn't been created or if the fetch hasn't started
    let doFetch = false;
    let loadPromise = state._promiseStore.get(promiseKey);
        
    if(!loadPromise){
      loadPromise = state._promiseStore.create(promiseKey);      
    }
    
    if(!loadPromise._startedFetch){
      doFetch = true;
    }

    if(doFetch){      
      (async () => {
        try {
          loadPromise._startedFetch = true;
          // Fetch all of the models from the API.  All unique loaded models will be commited to the store
          const fetchedModels = await loadPaginatedModels({state, commit, preCommit, filter});
          
          // Now, add all of the returned models to the promiseStore as individual models in case
          // someone asks for these models later via the AsyncModelLoader functions

          // collect the ids of the models that were returned by the filter
          const loadedIds = fetchedModels.map((model: any) => model.id);

          // Get the model just added to the store via commit (or added just before this code tried to add the model to the store)
          const loadedModels: any = [];
          loadedIds.forEach((id: string) => {
            if(!state.storeUtils){
              throw 'Invoked core store fetchModelsByFilter for a store with no utils';
            }

            const model = state.storeUtils.findById(id);
            const promiseKey = `${state._url('GET')}-${id}`;

            if(!state._promiseStore.get(promiseKey)){
              state._promiseStore.create(promiseKey);

              // resolve or reject the promise immediately
              if(model){
                state._promiseStore.get(promiseKey).resolve(model);
              }
              else {
                debugger;
                // Not sure how this could happen but just to be safe
                state._promiseStore.get(promiseKey).reject(`Model ${id} was not found in the store. this.getUrl=${state._url('GET')}`);
              }
            }
            
            if(model){
              loadedModels.push(model);
            }
          });
          
          // now finally resolve the promise for the filter with all of the loaded models
          loadPromise.resolve(loadedModels);
        }
        catch(err){
          loadPromise.reject(err); // probably want better error handling
        }
      })();
    }

    return state._promiseStore.get(promiseKey).promise;
  },

  select({commit, state}: {commit: Commit, state: CoreState}, selected: Model): Promise<Model|undefined>{
    commit(`${state._storeName}/select`, selected, {root: true});
    return Promise.resolve(state.selected);
  },

  updateSelectedCopy({commit, state}: {commit: Commit, state: CoreState}, updated: Model): Promise<Model|undefined> {    
    commit(`${state._storeName}/updateSelectedCopy`, updated, {root: true});
    return Promise.resolve(state.selectedCopy);
  }
};