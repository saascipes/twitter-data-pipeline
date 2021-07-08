import { NextFunction, Request, Response } from 'express';
import { ResponseCode, ResponseWrapper } from './Types';
import { formatError } from './ErrorMiddleware';


const hrTimeStr: string = 'hrtime';

export function handleBuildResponseWrapper(req: Request, res: Response, next: NextFunction): void {
  res['body'] = new ResponseWrapper();
  next();
}

export function handleStartTimer(req: Request, res: Response, next: NextFunction): void {
  res.setHeader(hrTimeStr, process.hrtime().toString());
  next();
}

export function handleResponse(req: Request, res: Response, next: NextFunction): void {    
  const response: ResponseWrapper = (res as any).body;
  const responseTimeStr: string = 'Response-Time';  

  if (req.header('correlationId') !== req['transactionId']) {
      if (!response.meta) {
          response.meta = {};
      }
      response.meta['correlationId'] = req.header('correlationId');
  }

  if (response.data === undefined && response.errors === undefined && response.warnings === undefined) {
    response.statusCode = ResponseCode.NOT_FOUND;
    res.status(response.statusCode).send({
        statusCode: response.statusCode,
        errors: [formatError(new Error('Page not found'), ResponseCode.NOT_FOUND, req)]
    });
  } 
  else {    
    res.status(response.statusCode).send({
        statusCode: response.statusCode,
        data: response.data,
        warnings: response.warnings,
        errors: response.errors,
        meta: response.meta
    });
  }

  next();
};


function buildHrTime(str):[number, number] {
  return str.split(',').map((item) => parseInt(item,10));
}