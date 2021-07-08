import { MutationTree } from 'vuex';
import { AlertStore, SgAlert, AlertPlacement } from './types';

export const mutations: MutationTree<AlertStore> = {  
  addModels(state, models: SgAlert[]){
    state.models.push(...models);

    // just take the first footer if it exists
    const footerAlert = models.find(m => m.placement === AlertPlacement.FOOTER);
    if(footerAlert){
      state.currentFooter = footerAlert;
    }

    const footerAlertRight = models.find(m => m.placement === AlertPlacement.FOOTER_RIGHT);
    if(footerAlertRight){
      state.currentFooterRight = footerAlertRight;
    }

    // just take the first footer if it exists
    const windowAlert = models.find(m => m.placement === AlertPlacement.WINDOW);
    if(windowAlert){
      state.currentWindow = windowAlert;
    }

    const timedAlerts = models.filter(a => a.timeShown !== -1);

    for(let timedAlert of timedAlerts){
      setTimeout(() => {
        // Vuex is kind of annoying because I'm not supposed to call mutations from another mutation
        (<any>this).commit('alertStore/removeModel', timedAlert);
      }, timedAlert.timeShown);
    }
  },

  removeModel(state, model: SgAlert){
    if(model === state.currentFooter){
      state.currentFooter = null;
    }

    if(model === state.currentFooterRight){
      state.currentFooterRight = null;
    }

    // Remove the alert from the store - it will dissapear
    state.models.splice(state.models.indexOf(model), 1);
  },

  removeAll(state){
    state.currentFooter = null;
    state.currentFooterRight = null;
    state.currentWindow = null;
    state.models.splice(0);
  }
};