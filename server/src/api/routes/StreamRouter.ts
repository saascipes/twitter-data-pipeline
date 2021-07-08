import { Router } from 'express';
import { streamController } from '../controllers/StreamController';

export class StreamRouter {

  public readonly router: Router;

  constructor() {
    this.router = Router();

    this.router.post('/', streamController.startStream);
  }
}

export const streamRouterSingleton = new StreamRouter();
export const streamRouter = streamRouterSingleton.router;