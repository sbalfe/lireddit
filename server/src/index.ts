import { ApolloServer } from 'apollo-server-express';
import 'dotenv-safe/config'
import ConnectRedis from 'connect-redis';
import express from "express";
import session from 'express-session';
import Redis from 'ioredis';
import path from "path";
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { createConnection } from 'typeorm';
import { __prod__ } from "./constants";
import { Post } from './entities/Post';
import { Updoot } from './entities/Updoot';
import { User } from './entities/User';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import { createUpdootLoader } from './utils/createUpdootLoader';
import { createUserLoader } from './utils/createUserLoader';

/* creats main function to run async. */
const main = async () => {


    const conn = await createConnection({
        type: 'postgres',
        logging: true,
        url: process.env.DATABASE_URL,
        synchronize: false /* automatic migration*/,
        migrations: [path.join(__dirname, './migrations/*')], /* define where to find the migrations */
        entities: [Post , User, Updoot]
    });

    await conn.runMigrations();
    //awa Post.delete({});

    // /* returs a promise */
    // const orm = await MikroORM.init(microConfig);
 
    // console.log("cunt");
    // /* https://mikro-orm.io/docs/migrations/  */
    // await orm.getMigrator().up();

    const app = express();

    const RedisStore = ConnectRedis(session)
    const redis= new Redis(process.env.REDIS_URL);

    app.set('proxy', 1); // notify there is a proxy infront > nginx

    redis.on("error", err => {
        console.log(err);
    }) 

    /* cors applied to all routes , specify specific routes, with commas seperate values: '/', '/route*/
    // app.use(cors({
    //     origin:['http://localhost:3000', 'https://studio.apollographql.com'],
    //     credentials: true,
    // }))
    
    /* runs before the apollo server middelware */
    app.use(
        session({
            name: 'qid',
            store: new RedisStore({ 
                client: redis,
                disableTouch: true
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
                httpOnly: true,
                sameSite: "lax",// csrf
                secure: __prod__, // only works in https
                domain: __prod__ ? "shriller44.co.uk" : undefined
            },
            saveUninitialized: false, // only save sessions if data is present.
            secret: process.env.SESSION_SECRET,
            resave: false,
            
        })
    )

    const apolloServer = await new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver , UserResolver],
            validate: false
        }), /* retuns promise with graphql schemas */

        /* pass request and response to the resolves in graphql */
        context: ({req,res }) => ({
           /* pass this into the context for the graphql resolvers to use, they all need the database*/
            req,
            res,
            redis,
            userLoader: createUserLoader(),
            updootLoader: createUpdootLoader()
        })
    })

    await apolloServer.start()

    const corsOptions = {
        origin:process.env.CORS_ORIGIN,
        credentials: true,
    }
    apolloServer.applyMiddleware({
        app,
        cors: corsOptions
    });

    app.listen(parseInt(process.env.PORT), () => {
        console.log("we are live on port 4000 you cunts")
    })

}

main().catch(err => {
    console.log(err);
})

