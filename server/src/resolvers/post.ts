import { Arg, Ctx, Field, FieldResolver, Info, InputType, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { getConnection } from "typeorm";
import { Post } from "../entities/Post";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";


@InputType()
class PostInput{
    @Field()
    title!: string
    @Field()
    text!: string
}

@ObjectType()
class PaginatedPosts {
    @Field(() => [Post])
    posts!: Post[];
    @Field()
    hasMore!: boolean; /* check whether there are new items in the list. */

}

@Resolver(Post)
export class PostResolver {

    /* field resolver based on the name of the function returns this as the value
        pased on the root which in this case is just the Post object

        so in the mutation it queries textSnippet instead of standard text, running this.
    */
    @FieldResolver(() => String)
    textSnippet(
        @Root() root: Post
    ){
        
        return root.text.slice(0,50);
    }

    /* for each post , resolve the user from the creator. */
    @FieldResolver(() => User)
    creator(
        @Root() post: Post,
        @Ctx() {userLoader}: MyContext
    ){
        
        /* userLoader to batch SQL requests together, within the same tick of */
        /* only sends the request for a unique user, does not repeat the same cached user. */
        return userLoader.load(post.creatorId) /* resolver for creator that just fetches a user each time rather than apply SQL  */
    }

    /* resolve the vote status for every user using the cached loader.*/
    @FieldResolver(() => Int, {nullable: true})
    async voteStatus(
        @Root() post: Post,
        @Ctx() {updootLoader, req} : MyContext
    ){
        if (!req.session.userId){
            return null;
        }
        
        const updoot = await updootLoader.load({
            postId: post.id,
            userId: req.session.userId
         })

         return updoot ? updoot.value : null; /* check if there is no status before returning value. */
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Arg('postId', () => Int) postId: number,
        @Arg('value', () => Int) value: number,
        @Ctx() {req}: MyContext
    ){

        const isUpdoot = value !== -1;
        const realValue = isUpdoot ? 1 : -1;
        const {userId} = req.session
        const updoot = await Updoot.findOne({where: {postId, userId}});

        /* user has already voted on this post before , and check its an upvote / downvote again*/
        if (updoot && updoot.value !== realValue) {
            await getConnection().transaction(async (tm) => {

                await tm.query(`
                    update updoot 
                    set value = $1
                    where "postId" = $2 and "userId" = $3
                `, [realValue, postId, userId])

                await tm.query(`
                    update post 
                    set points = points + $1
                    where id = $2;
                `, [2* realValue, postId]) /* 2 times as to remove the original vote, when you change it */
               
            })

        } else if (!updoot) {
            // has never votedbefor
            /* transaction rollback managed by typeorm logic. */
            await getConnection().transaction(async tm => {
                await tm.query(`
                    insert into updoot ("userId","postId", value)
                    values ($1, $2, $3);
                `, [userId, postId, realValue])

                await tm.query(`

                    update post 
                    set points = points + $1
                    where id = $2;

                `, [realValue, postId])
            })

        }
        return true
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
    @Query(() => PaginatedPosts)
    async posts(
        @Arg('limit', () => Int) limit: number, 
        @Arg('cursor', () => String, {nullable: true} /* initally there is no cursor */) cursor: string | null,
        @Ctx() {req}: MyContext,
        @Info() info: any
    ): Promise<PaginatedPosts /* explicit type def for type checking here */>{

        const realLimit = Math.min(50, limit); /* defined limit up to max of 50. */
        const plusOneRl = realLimit + 1;

        const replacements: any[] = [plusOneRl];
    
        if (cursor){
            replacements.push(new Date(parseInt(cursor)))
        }

        /* https://www.postgresql.org/docs/9.5/functions-json.html - json build object
            this creates a creator objject where the username is the username of the selection.

            creator: {username: 'name'}
        */
        const posts = await getConnection().query(`

            select 
            p.* 

            from post p 

            ${cursor ? `where p."createdAt" < $2` : ''}

            order by p."createdAt" DESC

            limit $1 

        `, replacements)

        const qb = getConnection()
            .getRepository(Post)
            .createQueryBuilder("p")
            .innerJoinAndSelect(
                "p.creator",
                "u",
                'u.id = p."creatorId"'
            )
            .orderBy('p."createdAt"', "DESC") /* keep the uppercase intact for postgresql to match, sorts by data descending */
            .take(plusOneRl)
        // if (cursor) { /* if there is a cursor then use it */
        //     qb.where('"createdAt" < :cursor', {cursor: new Date(parseInt(cursor))}) /* adds parameters, must parse the stirng to int to be used as the date */
        // }    

        //const poss = await qb.getMany(); // execute SQL

        
        /*
            give themm the actual limimt not plus one

            but if the length of the fetch is the same as realLimit + 1  then it can say they have more posts available.
         */
        // console.log("posts", posts);
        return {posts: posts.slice(0 , realLimit), hasMore: posts.length === plusOneRl}; // if its not the same then there are no posts as it fetching the specific number.
    }
    
    @Query(() => Post, {nullable: true})
    post(
            /* this id is what is written in the grapql query, this can be whatever you wish */
            @Arg('id', () => Int) id: number,
           
        ): Promise<Post | undefined>{
            return Post.findOne(id);
    } 

    /* mutation is for updating data, inserting data and deleting data */
    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
            /* this id is what is written in the grapql query, this can be whatever you wish */
            @Arg("input", () => PostInput) input: PostInput,
            @Ctx(){req}: MyContext
        ): Promise<Post | null>{

            /* 2 SQL queries executed here  */
            return Post.create({
                ...input,
                creatorId: req.session.userId
            }).save();
        }    
        
    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async updatePost(
            @Arg('id', () => Int) id: number,
            @Arg('title', () => String) title: string,
            @Arg('text', () => String) text: string,
            @Ctx (){req}: MyContext
        ): Promise<Post | null>{
            const {raw: result} = await getConnection()
                .createQueryBuilder()
                .update(Post)
                .set({title, text})
                .where('id = :id and "creatorId" = :creatorId', {id, creatorId: req.session.userId})
                .returning('*')
                .execute();
                
            return result[0]
        }   

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deletePost(
            @Arg('id', () => Int) id: number,
            @Ctx(){ req }: MyContext
        ): Promise<boolean>{
            
            await Post.delete({id, creatorId: req.session.userId})
            return true;
        }  
}