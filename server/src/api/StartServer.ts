import express = require('express');
import { NextFunction, Request, Response } from 'express';
import path = require('path');
import util = require('util');
const bodyParser = require('body-parser');
const compression = require('compression');
import * as config from 'config';
import { ruleRouter } from './routes/RuleRouter';
import { streamRouter } from './routes/StreamRouter';
import { ValidationError } from './utils/Errors';
import { handleErrors } from './utils/ErrorMiddleware';
import { handleBuildResponseWrapper, handleResponse, handleStartTimer } from './utils/ResponseMiddleware';
import * as fs from 'fs';


// Create a new express application instance
const app: express.Application = express();

const appName = 'SaaSGlue Twitter Stream Data Pipeline';

const environment = process.env.NODE_ENV || 'development';

var options = {
  autoIndex: false, // Don't build indexes
  reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
  reconnectInterval: 500, // Reconnect every 500ms
  poolSize: 10, // Maintain up to 10 socket connections
  // If not connected, return errors immediately rather than waiting for reconnect
  bufferMaxEntries: 0,
  useNewUrlParser: true
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

class AppBuilder {

  constructor(private readonly app) {
    this.setUpMiddleware();
    this.setUpRoutes();
    app.use(handleErrors);
    app.use(handleResponse);
  }

  private setUpMiddleware() {
    app.disable('etag');

    app.use(handleBuildResponseWrapper);
    // app.use(handleStartTimer);

    this.setUpClient();
  }

  private setUpClient() {
    // setup gzip / deflate for static resources and REST api responses
    app.use(compression({
      filter: (req: Request, resp: Response) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        else {
          return true;
        }
      }
    }));

    app.use(express.static(path.join(__dirname, '../../../clientv1/dist')));
  }

  private setUpRoutes(): void {
    const apiURLBase = '/api/v0';

    this.app.use(`${apiURLBase}/rule`, ruleRouter);
    this.app.use(`${apiURLBase}/stream`, streamRouter);
  }
}

new AppBuilder(app);




const port = process.env.PORT || 3000;

const server = app.listen(port, function () {
  console.log(`API listening on port ${port}!`);
});

export default server;