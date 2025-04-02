import { User } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends Omit<User, "password"> { }
  }
}

declare module "express-session" {
  interface SessionData {
    passport: {
      user: number;
    };
  }
}

export {};