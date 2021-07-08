import axios from 'axios';
import * as _ from 'lodash';
import * as config from 'config';

let tokenRefreshTime: number = 0;
let token: string = '';
let refreshToken: string = '';
let _teamId: string = '';

export const RestAPILogin = async (retryCount: number = 0) => {
    return new Promise<void>(async (resolve, reject) => {
        try {
            if ((new Date().getTime() - tokenRefreshTime < 30000) && token)
                return;

            token = '';

            let apiUrl = config.get("saasGlueApiURL");
            const url = `${apiUrl}/login/apiLogin`;

            const response = await axios({
                url,
                method: 'POST',
                responseType: 'text',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    'accessKeyId': config.get("saasGlueApiKeyId"),
                    'accessKeySecret': config.get("saasGlueApiSecretKey")
                }
            });

            tokenRefreshTime = new Date().getTime();
            token = response.data.config1;
            refreshToken = response.data.config2;
            _teamId = response.data.config3;
            resolve();
        } catch (e) {
            if (e.response && e.response.status && e.response.status == 401) {
                console.log(`Invalid authorization credentials`);
            }
        }
    });
}


export const RefreshAPIToken = async (retryCount: number = 0) => {
    return new Promise<void>(async (resolve, reject) => {
        // console.log('Waiting to aquire lockRefreshToken');
        try {
            if ((new Date().getTime() - tokenRefreshTime < 30000) && token)
                return;

            token = '';

            let apiUrl = config.get("saasGlueApiURL");

            const url = `${apiUrl}/login/refreshtoken`;

            const response = await axios({
                url,
                method: 'POST',
                responseType: 'text',
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: `Auth=${refreshToken};`
                }
            });

            tokenRefreshTime = new Date().getTime();
            token = response.data.config1;
            refreshToken = response.data.config2;
        } catch (err) {
            if (err.response && err.response.status && err.response.status == 401) {
                setTimeout(() => { RestAPILogin(retryCount); }, 0);
            }
        }
    });
}


export const RestAPICall = async (url: string, method: any, headers: any = {}, data: any = {}) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!token)
                await RestAPILogin();

            let apiUrl = config.get("saasGlueApiURL");
            let apiVersion = 'v0';
            let fullurl = `${apiUrl}/api/${apiVersion}/${url}`;

            const combinedHeaders: any = Object.assign({
                Auth: token,
                _teamId: _teamId
            }, headers);

            // logger.LogDebug(`RestAPICall`, {fullurl, method, combinedHeaders, data, token: token});
            console.log('Agent RestAPICall -> url ', fullurl, ', method -> ', method, ', headers -> ', JSON.stringify(combinedHeaders, null, 4), ', data -> ', JSON.stringify(data, null, 4), ', token -> ', token);

            const response = await axios({
                url: fullurl,
                method,
                responseType: 'text',
                headers: combinedHeaders,
                data: data
            });

            resolve(response.data);
        } catch (e) {
            if (e.response && e.response.data && e.response.data.errors && _.isArray(e.response.data.errors) && e.response.data.errors.length > 0 && e.response.data.errors[0].description == 'The access token expired') {
                await RefreshAPIToken();
                resolve(RestAPICall(url, method, headers, data));
            } else {
                const message = `Error occurred calling ${method} on '${url}': ${e.message}`;
                reject(new Error(message));
            }
        }
    });
}
