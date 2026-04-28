import { User } from './api.types';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: User;
      startTime?: number;
    }
  }
}

export {};
