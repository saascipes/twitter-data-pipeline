import axios from 'axios';
import moment from 'moment';
import _ from 'lodash';
import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store/index';
import { startApp } from '@/store/core/actions';
import VModal from 'vue-js-modal';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import VueSplit from 'vue-split-panel';
import bitset from 'bitset';

library.add(faSearch);
Vue.component('font-awesome-icon', FontAwesomeIcon);

Vue.use(VModal);
Vue.use(VueSplit);

Vue.config.productionTip = false;

const urlParams = new URLSearchParams(window.location.search);

// login and load data via the api
(async () => {
  await startApp(); //store.dispatch('securityStore/startApp');

  new Vue({
    router,
    store,
    render: h => h(App)
  }).$mount('#app');
  
})();


(<any>window).store = store;

// If is local development - include this stuff in console for easy debugging / testing
if((<any>window).webpackHotUpdate){
  (<any>window).axios = axios;
  (<any>window).moment = moment;
  (<any>window)._ = _;
  (<any>window).bitset = bitset;
}

