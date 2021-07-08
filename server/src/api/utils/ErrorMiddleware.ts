import { NextFunction, Request, Response } from 'express';
import { ResponseCode, ResponseWrapper } from './Types';
import { ValidationError } from './Errors';
import * as _ from 'lodash';

export function handleErrors(err: Error, req: Request, res: Response, next: NextFunction): void {
    let response: ResponseWrapper = res['body'];
    if (!response) {
        response = new ResponseWrapper();
        res['body'] = response;
    }
    const transactionId: string = req['transactionId'];

    console.log(buildErrorMessage(err.name, err.message, transactionId, undefined), transactionId);
    //logger.debug(buildErrorMessage(err.name, err.message, transactionId, undefined), transactionId);

    switch (err.name) {
        case 'UnauthorizedError':
            response.errors = [formatError(new Error('Invalid authorization token'), ResponseCode.UNAUTHORIZED, req)];
            response.statusCode = ResponseCode.UNAUTHORIZED;
            break;

        case 'SequelizeValidationError':
            response.errors = err['errors'].map(e => buildErrorMessage('Validation Error', e.message, transactionId, e.path));
            response.statusCode = ResponseCode.BAD_REQUEST;
            break;

        case 'Validation Error':
            const path: string | undefined = (err as ValidationError).getPath();
            response.statusCode = ResponseCode.BAD_REQUEST;
            response.errors = [buildErrorMessage(err.name, err.message, transactionId, path)];
            break;

        case 'SyntaxError':
            response.statusCode = ResponseCode.BAD_REQUEST;
            response.errors = [buildErrorMessage(err.name, err.message, transactionId, '')];
            break;

        // Mongoose validation error doesn't have a space in the name
        case 'ValidationError':
            response.statusCode = ResponseCode.BAD_REQUEST;
            let errors = (<any>err).errors;
            if (!_.isArray(errors)) {
                errors = [errors];
            }
            // The mongoose ValidationError object is a bit awkward
            for (let error of errors) {
                let validationError: any;
                for (validationError of Object.values(error)) {
                    if (!response.errors) {
                        response.errors = [];
                    }
                    response.errors.push(buildErrorMessage(validationError.name, validationError.message, transactionId, validationError.path));
                }
            }
            break;

        // case 'SequelizeUniqueConstraintError':
        //     response.statusCode = ResponseCode.BAD_REQUEST;
        //     response.errors = [buildErrorMessage(err.name, err.message, transactionId, undefined)];
        //     break;

        case 'MissingObjectError':
            response.statusCode = ResponseCode.NOT_FOUND;
            response.errors = [buildErrorMessage(err.name, err.message, transactionId, err['path'])];
            break;

        case 'Forbidden':
            response.statusCode = ResponseCode.FORBIDDEN;
            response.errors = [buildErrorMessage(err.name, err.message, transactionId, err['path'])];
            break;

        // case 'SyntaxError':
        //     response.statusCode = ResponseCode.BAD_REQUEST;
        //     response.errors = [buildErrorMessage(err.name, err.message, transactionId, undefined)];
        //     break;

        // case 'ResourceValidationError':
        //     response.statusCode = ResponseCode.BAD_REQUEST;
        //     response.errors = (err as ResourceValidationError).errors.map(
        //         error => buildErrorMessage(error.name, error.message, transactionId, error.getPath())
        //     );
        //     break;

        case 'PayloadTooLargeError':
            response.statusCode = ResponseCode.BAD_REQUEST;
            response.errors = [buildErrorMessage(err.name, err.message, transactionId, undefined)];
            break;

        case 'FreeTierLimitExceededError':
            response.statusCode = ResponseCode.UNAUTHORIZED;
            response.errors = [buildErrorMessage('FreeTierLimitExceededError', err.message, transactionId, err['path'])];
            break;

        default:
            if (err['code']) {
                response.errors = [err];
                response.statusCode = err['code'];
            } else {
                response.errors = [formatError(new Error('An unknown error has occurred.'), ResponseCode.UNEXPECTED_ERROR, req)];
                response.statusCode = ResponseCode.UNEXPECTED_ERROR;
                //logger.error(err, req['transactionId'], req.body);
            }
    }

    next();
}

/**
* @deprecated use buildErrorMessage instead, which puts the error in the correct format.
*/
export function formatError(err: Error, statusCode: number, req: Request): object {
    const msg: string = err['parent'] ? err['parent']['message'] : err.message;
    return {
        title: err['type'] ? err['type'] : err.name,
        description: msg,
        source: `Request ID: ${req['transactionId']}`,
        code: statusCode ? statusCode : ResponseCode.UNEXPECTED_ERROR
    };
}

export function buildErrorMessage(title: string, description: string, transactionId: string, source?: string, errorCode?: string): object {
    return {
        code: transactionId,
        title,
        description,
        source
    };
}