/// <reference types="express-session" />
import { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { createUpdootLoader } from './utils/createUpdootLoader';
import { createUserLoader } from './utils/createUserLoader';
export declare type MyContext = {
    req: Request & {
        session: Express.Session;
    };
    redis: Redis;
    res: Response;
    userLoader: ReturnType<typeof createUserLoader>;
    updootLoader: ReturnType<typeof createUpdootLoader>;
};
