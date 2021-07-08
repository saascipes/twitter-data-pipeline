
// A utility class to store a map of [key, promise]
export default class PromiseStore {

  // todo - clean up this Typescript
  private promises: any = {};

  get(key: string){
    return this.promises[key];
  }

  create(key: string){
    if(!this.promises[key]){
      let resolve, reject;

      const promise: any = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });

      // Since we need to trigger the resolve or reject functions outside of the promise
      // handler in the AsyncModelLoader we need to expose them as public properties
      this.promises[key] = {promise, resolve, reject};
    }

    return this.promises[key];
  }
};