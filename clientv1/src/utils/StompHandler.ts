import axios from 'axios';
import { Model } from '../store/types';
import { Client } from '@stomp/stompjs';
import { StoreType } from '@/store/types';
import { SgAlert, AlertPlacement } from '@/store/alert/types';
import store from '@/store/index';

export interface DomainMessage {
  domainType: string,
  operation: number,
  model: Model,
  correlationId?: string
}

export interface InitStompOptions {
  store: any, 
  url: string, 
  login: string, 
  passcode: string, 
  vHost: string, 
  exchangeName: string, 
  queueName: string
}


class StompHandler {

  private readonly store: any;
  private client!: Client;
  private readonly handlers: any = {};

  constructor( store: any, 
               public readonly url: string,
               public readonly login: string,
               public readonly passcode: string,
               public readonly vHost: string,
               public readonly exchangeName: string,
               public readonly queName: string){
    this.store = store;
  }

  public async connect(){
    this.client = new Client({
      brokerURL: this.url,
      connectHeaders: {
        login: this.login,
        passcode: this.passcode,
        host: this.vHost
      },
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000
    });

    this.client.onConnect = this.onConnect.bind(this);
    this.client.onStompError = this.onStompError.bind(this);

    this.client.activate();
  }

  private onConnect(frame: object): void {
    console.log(`Connected to the stream api at ${this.url}`);
    this.subscribe();
  }  

  private onStompError(frame: object): void{
    console.error('onStompError ', frame);
  }

  private subscribe(): void{
    const subscribeHeaders = {
      "x-queue-name": `${this.queName}-${Math.random().toFixed(5).substring(2)}`
    };

    this.client.subscribe(`/exchange/${this.exchangeName}/bp`, this.onMessage.bind(this), subscribeHeaders);
  }

  
  private onMessage(rawMessage: any): void {
    console.log('StompHandler.onMessage invoked ', rawMessage);
    const message: DomainMessage = JSON.parse(rawMessage.body);    
    
    if(this.handlers[message.domainType]){
      this.handlers[message.domainType](message);
    }
    else {
      // if the message was authored by myself, by default ignore it because it was already handled
      // if(message.correlationId !== correlationId){

      this.defaultMessageHandler(message);
      
      // }
      // else {
      //   console.log('Ignored my own stomp message');
      // }
    }
  }

  public registerMessageHandler(domainType: string, handler: (message: DomainMessage) => void){
    if(this.handlers[domainType]){
      throw `Error, code tried to register the a stomp handler for domain type ${domainType} but one already existed.`;
    }
    else {
      this.handlers[domainType] = handler;
    }
  }

  public defaultMessageHandler(message: DomainMessage){
    const storeName = `${message.domainType.substring(0, 1).toLowerCase()}${message.domainType.substring(1)}Store`;

    if(message.operation === 1){ // create
      if(!localStorage.getItem('silence_bp')){
        console.log('Browser Push, adding a model ', storeName, message.model);
      }
      this.store.commit(`${storeName}/addModels`, [message.model]);
    }
    else if(message.operation === 2){ // update
      if(!localStorage.getItem('silence_bp')){
        console.log('Browser push, updating a model ', storeName, message.model);
      }

      // only provide an update for models already in the store
      // bart todo - probably shouldn't go straight to the store like this to check if a model exists in a store..
      if(this.store.state[storeName].storeUtils.findById(message.model.id)){
        
        // alert the user if the selected model is the one that was updated
        if(correlationId !== message.correlationId){
          if(this.store.state[storeName].selected && this.store.state[storeName].selected.id === message.model.id){
            store.dispatch(`${StoreType.AlertStore}/addAlert`, new SgAlert(`The selected ${message.domainType} was modified`, AlertPlacement.FOOTER_RIGHT, 10000));      
          }
        }

        this.store.commit(`${storeName}/update`, message.model);
      }
      else {
        if(!localStorage.getItem('silence_bp')){
          console.log('Browser Push, no existing model, adding a new model instead ', storeName, message.model);
        }
        this.store.commit(`${storeName}/addModels`, [message.model]);
          // if(!localStorage.getItem('silence_bp')){
        //   console.log('ignored update for a model that was not cached yet', message.model);
        // }
      }
    }
    else if(message.operation === 3){ // delete
      if(!localStorage.getItem('silence_bp')){
        console.warn('Browser Push, deleting a model ', storeName, message);
      }
      
      this.store.commit(`${storeName}/delete`, message.model);
    }
  }

}


let stompInitializedResolver: any;
const stompInitialized = new Promise((resolve, reject)=> {
  stompInitializedResolver = resolve;
});

const correlationId = Math.random().toFixed(5).substring(2);
let stompHandler: StompHandler;

const initStompHandler = function({store, url, login, passcode, vHost, exchangeName, queueName}: InitStompOptions): StompHandler{
  if(stompHandler){
    throw 'Error, you tried to init the single stomp handler twice.';
  }
  else {
    stompHandler = new StompHandler(store, url, login, passcode, vHost, exchangeName, queueName);
    stompInitializedResolver();
  }

  return stompHandler;
};

const getStompHandler = function(): StompHandler{
  if(!stompHandler){
    throw 'Error, tried to get the single stomp handler but it was not initialized yet.';
  }
  else{
    return stompHandler;
  }
}

const getCorrelationId = function(): string {
  return correlationId;
}

// add the correlation id for every single request so I can compare the stomp message and see if my
// app instance was the author of the change
// axios.defaults.headers.common['correlationId'] = correlationId;
// axios.defaults.withCredentials = true;

export { StompHandler, initStompHandler, stompInitialized, getStompHandler, getCorrelationId };