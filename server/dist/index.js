"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
require("dotenv-safe/config");
const connect_redis_1 = __importDefault(require("connect-redis"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const ioredis_1 = __importDefault(require("ioredis"));
const path_1 = __importDefault(require("path"));
require("reflect-metadata");
const type_graphql_1 = require("type-graphql");
const typeorm_1 = require("typeorm");
const constants_1 = require("./constants");
const Post_1 = require("./entities/Post");
const Updoot_1 = require("./entities/Updoot");
const User_1 = require("./entities/User");
const hello_1 = require("./resolvers/hello");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const createUpdootLoader_1 = require("./utils/createUpdootLoader");
const createUserLoader_1 = require("./utils/createUserLoader");
/* creats main function to run async. */
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield typeorm_1.createConnection({
        type: 'postgres',
        logging: true,
        url: process.env.DATABASE_URL,
        synchronize: false /* automatic migration*/,
        migrations: [path_1.default.join(__dirname, './migrations/*')],
        entities: [Post_1.Post, User_1.User, Updoot_1.Updoot]
    });
    yield conn.runMigrations();
    //awa Post.delete({});
    // /* returs a promise */
    // const orm = await MikroORM.init(microConfig);
    // console.log("cunt");
    // /* https://mikro-orm.io/docs/migrations/  */
    // await orm.getMigrator().up();
    const app = express_1.default();
    const RedisStore = connect_redis_1.default(express_session_1.default);
    const redis = new ioredis_1.default(process.env.REDIS_URL);
    app.set('trust proxy', 1); // notify there is a proxy infront > nginx
    redis.on("error", err => {
        console.log(err);
    });
    /* cors applied to all routes , specify specific routes, with commas seperate values: '/', '/route*/
    // app.use(cors({
    //     origin:['http://localhost:3000', 'https://studio.apollographql.com'],
    //     credentials: true,
    // }))
    /* runs before the apollo server middelware */
    app.use(express_session_1.default({
        name: 'qid',
        store: new RedisStore({
            client: redis,
            disableTouch: true
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
            httpOnly: true,
            sameSite: "lax",
            secure: constants_1.__prod__,
            domain: constants_1.__prod__ ? ".shriller44.co.uk" : undefined
        },
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET,
        resave: false,
    }));
    const apolloServer = yield new apollo_server_express_1.ApolloServer({
        schema: yield type_graphql_1.buildSchema({
            resolvers: [hello_1.HelloResolver, post_1.PostResolver, user_1.UserResolver],
            validate: false
        }),
        /* pass request and response to the resolves in graphql */
        context: ({ req, res }) => ({
            /* pass this into the context for the graphql resolvers to use, they all need the database*/
            req,
            res,
            redis,
            userLoader: createUserLoader_1.createUserLoader(),
            updootLoader: createUpdootLoader_1.createUpdootLoader()
        })
    });
    yield apolloServer.start();
    console.log(process.env.CORS_ORIGIN);
    const corsOptions = {
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    };
    apolloServer.applyMiddleware({
        app,
        cors: corsOptions
    });
    app.listen(parseInt(process.env.PORT), () => {
        console.log("we are live on port 4000 you cunts");
    });
});
main().catch(err => {
    console.log(err);
});
