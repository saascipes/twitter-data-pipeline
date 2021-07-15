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

    public async startStream(): Promise<object> {
        try {
            const teamId: string = config.get("saasGlueTeamId");
            const existingSchedulesQuery: any = await RestAPICall(`schedule/?filter=_jobDefId==${config.get("tweetsAnalyzerJobDefId")}`, 'GET', {_teamId: teamId});
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