import { Router } from 'express';
import { ruleController } from '../controllers/RuleController';

export class RuleRouter {

  public readonly router: Router;

  constructor() {
    this.router = Router();

    this.router.get('/',  ruleController.getRules);
    this.router.post('/', ruleController.createRule);
    this.router.delete('/:ruleId', ruleController.deleteRule);
    this.router.post('/reset/', ruleController.resetRules);
  }
}

export const ruleRouterSingleton = new RuleRouter();
export const ruleRouter = ruleRouterSingleton.router;