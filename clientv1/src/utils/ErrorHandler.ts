import { SgAlert, AlertPlacement, AlertCategory } from '@/store/alert/types';
import { StoreType } from '@/store/types';
import { AxiosResponse } from 'axios';
import store from '../store/index';
import _ from 'lodash';

// Put any global error handlers here
export const showErrors = (message: string, err: any) => {
  // Default to the same old internal error messages here
  showErrorsInternal(message, err);
}

const showErrorsInternal = (message: string, err: any) => {
  const axiosResponse: AxiosResponse|null = err.response ? <AxiosResponse> err.response : null;

  if(axiosResponse && axiosResponse.data && axiosResponse.data.errors){
    const errors = axiosResponse.data.errors;
    message += `<br><table class="table" style="margin-top: 10px; margin-bottom: 10px;>`;
    errors.map(({title, description}) => {
      message += `<tr class="tr"> 
                    <td class="td">${title}</td> 
                    <td class="td">${description}</td> 
                  </tr>`;
    });
    message += `</table><br>`;
  }
  else if(_.isString(err)){
    message += err;
  }

  store.dispatch(`${StoreType.AlertStore}/addAlert`, new SgAlert(message, AlertPlacement.WINDOW, AlertCategory.ERROR));
}