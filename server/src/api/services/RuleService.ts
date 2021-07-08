import { RestAPICall } from '../utils/SaasGlueComm';
import * as _ from 'lodash';
import * as config from 'config';
const util = require('util');
const request = require('request');


const authMessage = {
    title: "Could not authenticate",
    details: [
        `Please make sure your bearer token is correct. 
        If using Glitch, remix this app and add it to the .env file`,
    ],
    type: "https://developer.twitter.com/en/docs/authentication",
};


const post = util.promisify(request.post);
const get = util.promisify(request.get);


export class RuleService {

    public async getRules() {
        if (!process.env.TWITTER_BEARER_TOKEN){
            return authMessage;
        }

        const token = process.env.TWITTER_BEARER_TOKEN;
        const requestConfig = {
            url: config.get("rulesURL"),
            auth: {
                bearer: token,
            },
            json: true,
        };

        const response = await get(requestConfig);

        if (response.statusCode !== 200)
            throw new Error(response.body.error.message);

        return response;
    }


    public async createRule(data: any): Promise<object> {
        if (!process.env.TWITTER_BEARER_TOKEN){
            return authMessage;
        }

        const token = process.env.TWITTER_BEARER_TOKEN;

        const payload = { add: [{ value: data.newRule }] };

        const requestConfig = {
            url: config.get("rulesURL"),
            auth: {
                bearer: token,
            },
            json: payload,
        };

        const response: any = await post(requestConfig);

        if (response.statusCode !== 201){
            console.log('error -> ', JSON.stringify(response.body, null, 4));
            throw new Error(response.body.error);
        }

        return response;
    }


    public async deleteRule(id: string): Promise<object> {
        if (!process.env.TWITTER_BEARER_TOKEN){
            return authMessage;
        }

        const token = process.env.TWITTER_BEARER_TOKEN;

        const payload = { delete: { ids: [id] } };

        const requestConfig = {
            url: config.get("rulesURL"),
            auth: {
                bearer: token,
            },
            json: payload,
        };

        const response: any = await post(requestConfig);

        if (response.statusCode !== 200)
            throw new Error(response.body.error.message);

        return response;
    }


    public async resetRules(): Promise<object> {
        console.log('resetRules -> start');
        try {
            const res: any = await RestAPICall('job', 'POST',
                {
                    _jobDefId: config.get("tweetsAnalyzerJobDefId")
                },
                {
                    runtimeVars: {
                        deleteAllExistingTweets: true
                    }
                });

            console.log('launch job response -> ', res.data);
        } catch (err) {
            console.log(err);
        }

        return {success: true};
    }
}

export const ruleService = new RuleService();