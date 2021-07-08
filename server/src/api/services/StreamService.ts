import { RestAPICall } from '../utils/SaasGlueComm';
import * as _ from 'lodash';
import * as config from 'config';
const util = require('util');
const request = require('request');
import * as moment from 'moment';


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


export class StreamService {

    public async getStreams() {
        if (!process.env.TWITTER_BEARER_TOKEN){
            return authMessage;
        }

        const token = process.env.TWITTER_BEARER_TOKEN;
        const requestConfig = {
            url: config.get("streamsURL"),
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


    public async createStream(data: any): Promise<object> {
        if (!process.env.TWITTER_BEARER_TOKEN){
            return authMessage;
        }

        const token = process.env.TWITTER_BEARER_TOKEN;

        const payload = { add: [{ value: data.newStream }] };

        const requestConfig = {
            url: config.get("streamsURL"),
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


    public async deleteStream(id: string): Promise<object> {
        if (!process.env.TWITTER_BEARER_TOKEN){
            return authMessage;
        }

        const token = process.env.TWITTER_BEARER_TOKEN;

        const payload = { delete: { ids: [id] } };

        const requestConfig = {
            url: config.get("streamsURL"),
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


    public async startStream(): Promise<object> {
        try {
            const teamId: string = config.get("saasGlueTeamId");
            const existingSchedulesQuery: any = await RestAPICall(`schedule/?filter=_jobDefId==${config.get("tweetsAnalyzerJobDefId")}`, 'GET', {_teamId: teamId});
            console.log('existingSchedulesQuery -> ', existingSchedulesQuery);
            let schedule: any = {};
            const streamEndTime = moment.utc().add(10, 'm').toDate().toISOString();
            if (existingSchedulesQuery.statusCode == 200 && existingSchedulesQuery.data.length > 0) {
                schedule = existingSchedulesQuery.data[0];
                if (schedule.name === 'every minute') {
                    schedule.isActive = true;
                    schedule.End_Date = streamEndTime;
                    let resUpdate: any = await RestAPICall(`schedule/${schedule.id}`, 'PUT', {}, { isActive: true, End_Date: streamEndTime });
                    console.log('schedule update res -> ', resUpdate);
                    return { succes: true };
                }
            }

            schedule = {
                '_teamId': config.get("saasGlueTeamId"), 'name': 'every minute', 'isActive': true, '_jobDefId': config.get("tweetsAnalyzerJobDefId"), 
                'TriggerType': 'interval', "interval": {"Minutes": "1", "End_Date": streamEndTime},
                'FunctionKwargs': { '_teamId': config.get("saasGlueTeamId"), 'targetId': config.get("tweetsAnalyzerJobDefId") }
            };    
            let resPost: any = await RestAPICall(`schedule`, 'POST', {}, schedule);
            console.log('schedule update res -> ', resPost);
            return {succes: true};
        } catch (err) {
            console.log(err);
        }

        return {success: false};
    }
}

export const streamService = new StreamService();