import { errorExchange, fetchExchange, gql, stringifyVariables } from "@urql/core"
import { cacheExchange, Resolver, Cache } from "@urql/exchange-graphcache"
import { dedupExchange } from "urql"
import { DeletePostMutationVariables, LoginMutation, LogoutMutation, MeDocument, MeQuery, RegisterMutation, VoteMutationVariables } from "../generated/graphql"
import { betterUQ } from "./betterUQ"
import  Router from "next/router"
import { isServer } from "./isServer"

/*TODO: RESARCH CUSTOM RESOLVERS */

/* https://formidable.com/open-source/urql/docs/graphcache/ read this  */
 /* https://formidable.com/open-source/urql/docs/graphcache/local-resolvers/  */

/*
  explanation:
   > we plug this in to return a string array which contains the data stored in cache.
   > takes in parent which is Query data we are adding to
    - also fieldargs which is the arguments passed to the resolver
    - cache to operate on the current cache
    - info stores data about our current resolver
      - we take parent key and fieldname off, Query and post respectively. 

    we inspect all fields with Query, and then filter out to only select posts

    check if there is any data by resolving using the field key which is posts({"cursor":"1630008244567","limit":10}) for example

    then go through each of the posts queries and resolve the fields based on the entity key and field key

    and push this new data into the string of results and return these results, which is the new updated cache to be fetched
    from local storage to be displayed on our page
*/
const cursorPagination = () => {
  
  /* returns resolvers  */
  return (_parent, fieldArgs, cache, info) => {
  

    /* entity key is Query, fieldname is posts which is the resolver we are attempting to modify.
    
      parentKey: Query
      fieldname: posts

      taken off info 
    */
    const { parentKey: entityKey, fieldName } = info;

    /* gets all the fields of the entity key under this name 
      https://formidable.com/open-source/urql/docs/api/graphcache/#inspectfields

      returns all the queries, with the key which contains the arguments as such

      example of one of the objects : { 
                arguments: {limit: 10}
                fieldKey: "posts({\"limit\":10})"
                fieldName: "posts"
            } 
    */
    const allFields = cache.inspectFields(entityKey);
  

    /* remove all fieldnames that are not of the posts type to only focus on the posts cache */
    const fieldInfos = allFields.filter(info => info.fieldName === fieldName);
    const size = fieldInfos.length;

    /* undefined, no cache stored. */
    if (size === 0) {
      return undefined;
    }

    const results: string[] = [];

    /* construct a new field key to add onto, to query more data from the cache 
      example after pressing load more fkey posts({"cursor":"1630008244567","limit":10})
    
    */
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`


    const inCache = cache.resolve(cache.resolveFieldByKey(entityKey, fieldKey) as string, "posts");
    /* check if there is any data in the cache and set the value to true or false which is what partial decides
        in this custom resolver.
    */
    
    info.partial = !inCache;

    /* go through each field key and resolve the field from the entity, contains are arguments of the posts */

    let hasMore = true;
    

    fieldInfos.forEach((fi) => {
  
      /* entity key: Query, fieldkey :  posts({"cursor":"1630008244567","limit":10}) (example)  */
      const key = cache.resolve(entityKey, fi.fieldKey) as string[];
    
      /* resolves the further fields that were resolved from the key, like a tree down structure */
      const data = cache.resolve(key, 'posts') as string[];
    
      const _hasMore = cache.resolve(key , 'hasMore');
      if (!_hasMore){
        hasMore = _hasMore as boolean;
      }
     
      results.push(...data);

    });


    /* returns an array of strings which contain the data */

    
    return {
      __typename: "PaginatedPosts", /* make sure to return the typename also  */
      hasMore,
      posts: results
    };

  }
};

function invalidateAllPosts(cache: Cache ){

    /* https://formidable.com/open-source/urql/docs/graphcache/cache-updates/#invalidating-entities */

    /* removes from cache. as to say it requires a refetch. */

    const allFields = cache.inspectFields('Query');
    const fieldInfos = allFields.filter(info => info.fieldName === 'posts');

    fieldInfos.forEach((fi) => {
        cache.invalidate('Query', 'posts', fi.arguments || {})
    })

}

//https://formidable.com/open-source/urql/docs/graphcache/cache-updates/

/* connect us to the graphql server on the backend  */

export const createUrqlClient = (ssrExchange: any, ctx: any) =>{ 

  let cookie = ''
  if (isServer()){
    cookie = ctx?.req?.headers?.cookie;
  }

  return {
  
    url: process.env.NEXT_PUBLIC_API_URL as string,
    fetchOptions: {
      credentials: "include", /* sends the cookie from the front end to back for authentication */
      headers:  cookie ? {
        cookie,
      } : undefined
    } as const,
    /* runs when login or register mutation runs which updates the cache */
    exchanges: [dedupExchange, cacheExchange({
      keys: {
        /* rename the id, we just ignore it. */
        PaginatedPosts: () => null,
      },
      resolvers: {  
        Query: {
          /* stores the result of the query for posts in cache */
          posts: cursorPagination(),
        },
      },
      updates : {
        Mutation: {
          deletePost: (_result ,args, cache, info) => {
             /* makes post as null by default, can change this by adding schema and tell urql of it. */
             cache.invalidate({
               __typename: 'Post',
               id: (args as DeletePostMutationVariables).id
             })
          },
          vote: (_result ,args, cache, info) => {
            const {postId, value} = args as VoteMutationVariables

            /* reads cache fragment , then uses this data to increment points in the cache.  */
            const data = cache.readFragment(
              gql`
                fragment _ on Post {
                  id
                  points
                  voteStatus
                }
              `,
              { id: postId }
            ); // Data or null

            if (data) {
              if (data.voteStatus === value){
                return;
              }
              const newPoints = data.points + ((!data.voteStatus ? 1 : 2 ) * value);
              cache.writeFragment(
                gql`
                  fragment __ on Post {
                    points
                    voteStatus
                  }
                `,
                { id: postId, points: newPoints, voteStatus: value} 
              );
            }
          },
          createPost: (_result ,args, cache, info) => {
             invalidateAllPosts(cache);

            },
            logout: (_result ,args, cache, info) => {
              betterUQ<LogoutMutation, MeQuery>(
                cache,
                {query: MeDocument},
                _result,
                () => ({me: null})
              )
            },
            login: (_result, args, cache, info) => {


              /*
              This runs whenever the login mutation is actually called

                  it updates the locally stored value of the MeQuery result.

                  The lambda function takes in result of type LoginMutation and query of type MeQuery

                  uses the value of this result to determine whether to update the value of MeQuery stored locally
                    > we specified to the update query what local copy we wish to update in the second parameter {query:MeDocument} of type MeQuery
                    > this holds the status of the MeQuery locally 

                _result = whatever the login mutation yielded us
                cache = handle to the urql cache to update
                {query: MeDocument} = query to update the local value
                  result in the lambda is _result with correct Type def MeQuery in this case
                  query is the stored result of the MeDocument > we return the query if an error otherwise return the new updated query result

                  Example here:

                  take in the value of login mutation, which the server sends us data back

                  use this value to choose which query to send to the local me document 

                  we return the same query if it failed to login , otherwise we return the new me query which is the logged in user
                    > of course extracting this data of the login mutation
              */
              betterUQ<LoginMutation, MeQuery>(cache,
                {query: MeDocument},
                  _result,
                  (result, query) => {
                    if (result.login.errors){
                      return query
                    } else{
                      return {
                        me: result.login.user
                      };
                    }
                  }
                );

                invalidateAllPosts(cache); // invalidate on login to refetch the values for automatic viewing 
            },
              register: (_result, args, cache, info) => {
              betterUQ<RegisterMutation, MeQuery>(cache,
                {query: MeDocument},
                  _result,
                  (result, query) => {
                    if (result.register.errors){
                      return query
                    } else{
                      return {
                        me: result.register.user
                      };
                    }
                  }
                );
            },
          }
        }
      }
    ),errorExchange ({
        onError(error){
        if (error?.message.includes("not authenticated")){
          Router.replace('/login');
        }
      }
    }), ssrExchange, fetchExchange]
}}