"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostResolver = void 0;
const type_graphql_1 = require("type-graphql");
const typeorm_1 = require("typeorm");
const Post_1 = require("../entities/Post");
const Updoot_1 = require("../entities/Updoot");
const User_1 = require("../entities/User");
const isAuth_1 = require("../middleware/isAuth");
let PostInput = class PostInput {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], PostInput.prototype, "title", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], PostInput.prototype, "text", void 0);
PostInput = __decorate([
    type_graphql_1.InputType()
], PostInput);
let PaginatedPosts = class PaginatedPosts {
};
__decorate([
    type_graphql_1.Field(() => [Post_1.Post]),
    __metadata("design:type", Array)
], PaginatedPosts.prototype, "posts", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", Boolean)
], PaginatedPosts.prototype, "hasMore", void 0);
PaginatedPosts = __decorate([
    type_graphql_1.ObjectType()
], PaginatedPosts);
let PostResolver = class PostResolver {
    /* field resolver based on the name of the function returns this as the value
        pased on the root which in this case is just the Post object

        so in the mutation it queries textSnippet instead of standard text, running this.
    */
    textSnippet(root) {
        return root.text.slice(0, 50);
    }
    /* for each post , resolve the user from the creator. */
    creator(post, { userLoader }) {
        /* userLoader to batch SQL requests together, within the same tick of */
        /* only sends the request for a unique user, does not repeat the same cached user. */
        return userLoader.load(post.creatorId); /* resolver for creator that just fetches a user each time rather than apply SQL  */
    }
    /* resolve the vote status for every user using the cached loader.*/
    voteStatus(post, { updootLoader, req }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.session.userId) {
                return null;
            }
            const updoot = yield updootLoader.load({
                postId: post.id,
                userId: req.session.userId
            });
            return updoot ? updoot.value : null; /* check if there is no status before returning value. */
        });
    }
    vote(postId, value, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const isUpdoot = value !== -1;
            const realValue = isUpdoot ? 1 : -1;
            const { userId } = req.session;
            const updoot = yield Updoot_1.Updoot.findOne({ where: { postId, userId } });
            /* user has already voted on this post before , and check its an upvote / downvote again*/
            if (updoot && updoot.value !== realValue) {
                yield typeorm_1.getConnection().transaction((tm) => __awaiter(this, void 0, void 0, function* () {
                    yield tm.query(`
                    update updoot 
                    set value = $1
                    where "postId" = $2 and "userId" = $3
                `, [realValue, postId, userId]);
                    yield tm.query(`
                    update post 
                    set points = points + $1
                    where id = $2;
                `, [2 * realValue, postId]); /* 2 times as to remove the original vote, when you change it */
                }));
            }
            else if (!updoot) {
                // has never votedbefor
                /* transaction rollback managed by typeorm logic. */
                yield typeorm_1.getConnection().transaction((tm) => __awaiter(this, void 0, void 0, function* () {
                    yield tm.query(`
                    insert into updoot ("userId","postId", value)
                    values ($1, $2, $3);
                `, [userId, postId, realValue]);
                    yield tm.query(`

                    update post 
                    set points = points + $1
                    where id = $2;

                `, [realValue, postId]);
                }));
            }
            return true;
        });
    }
    /* pagination , where cursor defines the location to start reading from. */
    /* https://www.postgresql.org/docs/8.1/queries-limit.html */
    /*
        explanation:

        we take a limit of how many posts to show

        cursor defines which post to start showing

        ordered by the most recent post downwards

        use limit to define a take > takes a specified ammmount of the outputted SQL to

        conditioanlly check if cursor is not null and if so only fetch dates created before the specified time in cursor.

        from this cursor, how many items do want after that,

        TL:DR
        in our case the items start from top to bottom on the page, the one at the top is the time closest to but not over cursor

        and the number of items we go back in time for depends on the limit, as we organise by newest post descending.
    */
    posts(limit, cursor, { req }, info) {
        return __awaiter(this, void 0, void 0, function* () {
            const realLimit = Math.min(50, limit); /* defined limit up to max of 50. */
            const plusOneRl = realLimit + 1;
            const replacements = [plusOneRl];
            if (cursor) {
                replacements.push(new Date(parseInt(cursor)));
            }
            /* https://www.postgresql.org/docs/9.5/functions-json.html - json build object
                this creates a creator objject where the username is the username of the selection.
    
                creator: {username: 'name'}
            */
            const posts = yield typeorm_1.getConnection().query(`

            select 
            p.* 

            from post p 

            ${cursor ? `where p."createdAt" < $2` : ''}

            order by p."createdAt" DESC

            limit $1 

        `, replacements);
            const qb = typeorm_1.getConnection()
                .getRepository(Post_1.Post)
                .createQueryBuilder("p")
                .innerJoinAndSelect("p.creator", "u", 'u.id = p."creatorId"')
                .orderBy('p."createdAt"', "DESC") /* keep the uppercase intact for postgresql to match, sorts by data descending */
                .take(plusOneRl);
            // if (cursor) { /* if there is a cursor then use it */
            //     qb.where('"createdAt" < :cursor', {cursor: new Date(parseInt(cursor))}) /* adds parameters, must parse the stirng to int to be used as the date */
            // }    
            //const poss = await qb.getMany(); // execute SQL
            /*
                give themm the actual limimt not plus one
    
                but if the length of the fetch is the same as realLimit + 1  then it can say they have more posts available.
             */
            // console.log("posts", posts);
            return { posts: posts.slice(0, realLimit), hasMore: posts.length === plusOneRl }; // if its not the same then there are no posts as it fetching the specific number.
        });
    }
    post(
    /* this id is what is written in the grapql query, this can be whatever you wish */
    id) {
        return Post_1.Post.findOne(id);
    }
    /* mutation is for updating data, inserting data and deleting data */
    createPost(
    /* this id is what is written in the grapql query, this can be whatever you wish */
    input, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            /* 2 SQL queries executed here  */
            return Post_1.Post.create(Object.assign(Object.assign({}, input), { creatorId: req.session.userId })).save();
        });
    }
    updatePost(id, title, text, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { raw: result } = yield typeorm_1.getConnection()
                .createQueryBuilder()
                .update(Post_1.Post)
                .set({ title, text })
                .where('id = :id and "creatorId" = :creatorId', { id, creatorId: req.session.userId })
                .returning('*')
                .execute();
            return result[0];
        });
    }
    deletePost(id, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Post_1.Post.delete({ id, creatorId: req.session.userId });
            return true;
        });
    }
};
__decorate([
    type_graphql_1.FieldResolver(() => String),
    __param(0, type_graphql_1.Root()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.Post]),
    __metadata("design:returntype", void 0)
], PostResolver.prototype, "textSnippet", null);
__decorate([
    type_graphql_1.FieldResolver(() => User_1.User),
    __param(0, type_graphql_1.Root()),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.Post, Object]),
    __metadata("design:returntype", void 0)
], PostResolver.prototype, "creator", null);
__decorate([
    type_graphql_1.FieldResolver(() => type_graphql_1.Int, { nullable: true }),
    __param(0, type_graphql_1.Root()),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.Post, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "voteStatus", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg('postId', () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Arg('value', () => type_graphql_1.Int)),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "vote", null);
__decorate([
    type_graphql_1.Query(() => PaginatedPosts),
    __param(0, type_graphql_1.Arg('limit', () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Arg('cursor', () => String, { nullable: true } /* initally there is no cursor */)),
    __param(2, type_graphql_1.Ctx()),
    __param(3, type_graphql_1.Info()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "posts", null);
__decorate([
    type_graphql_1.Query(() => Post_1.Post, { nullable: true }),
    __param(0, type_graphql_1.Arg('id', () => type_graphql_1.Int)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "post", null);
__decorate([
    type_graphql_1.Mutation(() => Post_1.Post),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("input", () => PostInput)),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PostInput, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "createPost", null);
__decorate([
    type_graphql_1.Mutation(() => Post_1.Post),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg('id', () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Arg('title', () => String)),
    __param(2, type_graphql_1.Arg('text', () => String)),
    __param(3, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "updatePost", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg('id', () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "deletePost", null);
PostResolver = __decorate([
    type_graphql_1.Resolver(Post_1.Post)
], PostResolver);
exports.PostResolver = PostResolver;
