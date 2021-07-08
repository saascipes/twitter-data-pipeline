import Vue from 'vue';
import Router, { Route } from 'vue-router';
import _ from 'lodash';

Vue.use(Router);

const router = new Router({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes: [
  ]
});

router.beforeEach(async (to: Route, from: Route, next: (options?: any) => void) => { 
  let shouldCancel = false;
  
  // Need to intercept if a beforeLeave/beforeEnter handler cancelled the navigation
  const nextInterceptor = (options: any) => {    
    if(_.isBoolean(options) && !options){
      shouldCancel = true;
    }

    next(options);
  };

  if(!shouldCancel && from.meta.beforeLeave){
    await from.meta.beforeLeave(to, from, nextInterceptor);
  }

  if (!shouldCancel && to.meta.beforeEnter) {
    await to.meta.beforeEnter(to, from, nextInterceptor);
  }
  
  if(!shouldCancel){
    next();
  }  
});

router.afterEach(async (to: Route, from: Route) => {

  if (to.meta.afterEnter) {
    await to.meta.afterEnter(to, from);
  }
});

export default router;
