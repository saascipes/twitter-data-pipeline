import { Module } from 'vuex';
import { RootState } from '@/store/types';
import { AlertStore } from './types';
import { actions } from './actions';
import { mutations } from './mutations';

export const state: AlertStore = {
  models: [],
  currentFooter: null,
  currentFooterRight: null,
  currentWindow: null
};


export const alertStore: Module<AlertStore, RootState> = {
    namespaced: true,
    state,
    actions,
    mutations
};