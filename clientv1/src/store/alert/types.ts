import { Model, LinkedModel } from '@/store/types'

export enum AlertPlacement {
  'WINDOW' = 0,
  'FOOTER' = 1,
  'FOOTER_RIGHT' = 2
}

export enum AlertCategory {
  'INFO' = 0,
  'WARNING' = 1,
  'ERROR' = 2
}

// Alert is apparently some kind of reserved word
export class SgAlert  {

  public readonly id: string;

  constructor( public readonly message: string, 
               public readonly placement: AlertPlacement,
               public readonly category: AlertCategory = AlertCategory.INFO,
               public readonly timeShown: number = 5000){
    // Just give it a random id;
    this.id = Math.random().toFixed(6).substring(2);
  }
};

export interface AlertStore {
  models: SgAlert[],
  currentFooter: SgAlert | null,
  currentFooterRight: SgAlert | null,
  currentWindow: SgAlert | null
}

(<any>window).SGA = SgAlert;