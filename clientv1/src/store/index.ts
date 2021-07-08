import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import { RootState } from '@/store/types';
import { topicStore } from '@/store/topic/index';
import { ruleStore } from '@/store/rule/index';

Vue.use(Vuex);

const store: StoreOptions<RootState> = {
    strict: false, //the @BindSelectedCopy covers this concern process.env.NODE_ENV !== 'production',

    state: {
        version: '1.0.0'
    },

    modules: {       
        topicStore,
        ruleStore
    }
};

export default new Vuex.Store<RootState>(store);
