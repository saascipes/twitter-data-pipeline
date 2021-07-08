import { CoreState, Model } from '../types';
import _ from 'lodash';
import moment from 'moment-timezone';

type IsEqualCustomizer = (value: any, other: any, indexOrKey?: number | string | symbol) => boolean;

export default class StoreUtils {
  private readonly modelsById: { [key: string]: Model } = {};

  constructor(private readonly state: CoreState) {

  }

  public deleteById(id: string) {
    if(!id){
      throw `Invoked StoreUtils.deleteById with an empty id for store ${this.state._storeName}`;
    }
    if (this.modelsById[id]) {
      delete this.modelsById[id];
    }
  }

  public findById(id: string): Model {
    if(!id){
      throw `Invoked StoreUtils.findById with an empty id for store ${this.state._storeName}`;
    }
    if (!this.modelsById[id]) {
      // try to find it in the storeArray and cache it
      const model: any = this.state.models.find((check: any) => {
        return check.id.toString() === id.toString();
      });

      if (model) {
        this.modelsById[id] = model;
      }
    }

    return this.modelsById[id];
  }

  public findIndexById(id: string): number {
    return this.state.models.findIndex((model: Model) => {
      return model.id === id;
    });
  }

  private getChanges(object: {}, base: {}, customizer?: IsEqualCustomizer): {} {
    function changes(object: {}, base: any, customizer?: IsEqualCustomizer) {
      return _.transform(object, function (result: any, value, key) {
        if (!_.isEqualWith(value, base[key], customizer)) {
          let a;

          if(value instanceof moment) {
            a = moment(value);
          } else {
            a = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key], customizer) : value;
          }

          result[key] = a;
        }
      });
    }

    return changes(object, base, customizer);
  }

  public getSelectedCopyChanges(isEqualCustomizer?: IsEqualCustomizer): {} {
    if (this.state.selected && this.state.selectedCopy) {
      return this.getChanges(this.state.selectedCopy, this.state.selected, isEqualCustomizer);
    }
    else {
      return false;
    }
  }

  public hasSelectedCopyChanged(isEqualCustomizer?: IsEqualCustomizer): boolean {
    if (this.state.selected && this.state.selectedCopy) {
      return !_.isEqualWith(this.state.selected, this.state.selectedCopy, isEqualCustomizer);
    }
    else {
      return false;
    }
  }

}