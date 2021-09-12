
import {Request, Response} from 'express';
import {Redis} from 'ioredis'; 
import { createUpdootLoader } from './utils/createUpdootLoader';
import { createUserLoader } from './utils/createUserLoader';

export type MyContext = {
    req: Request & {session: Express.Session}; // and sign will bind two types together.
    redis: Redis;
    res: Response;
    userLoader: ReturnType< typeof createUserLoader>; // obtain return type of some function
    updootLoader: ReturnType< typeof createUpdootLoader>;
}