export class MissingObjectError extends Error {
  constructor (message: string) {
      super(message);
      this.name = 'MissingObjectError';
  }
}


export class FreeTierLimitExceededError extends Error {
  constructor (message: string) {
      super(message);
      this.name = 'FreeTierLimitExceededError';
  }
}


export class ValidationError extends Error {
  private readonly path: string | undefined;

  constructor (message: string, path?: string) {
      super(message);
      this.name = 'Validation Error';
      this.path = path;
  }

  public getPath(): string | undefined {
      return this.path;
  }
}


export class ForbiddenError extends Error {
  private readonly path: string | undefined;

  constructor (message: string, path?: string) {
      super(message);
      this.name = 'Forbidden';
      this.path = path;
  }

  public getPath(): string | undefined {
      return this.path;
  }
}
