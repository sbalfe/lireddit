import { QueryInput, Cache } from '@urql/exchange-graphcache';

/*
  takes Result and Query to be defined as the functions parameters generically.
*/
export function betterUQ<Result, Query>(
  cache: Cache,
  qi: QueryInput,
  result: any,
  fn: (r: Result, q: Query) => Query) {
  //https://formidable.com/open-source/urql/docs/api/graphcache/#cache
  /*
    Here we use the cache.updateQuery method,
    which is similar to the cache.readQuery method that we've seen on the "Local Resolvers" page before.
 
    This method accepts a callback, which will
    give us the data of the query, as read from the locally cached data, and we may return an updated version of this data. While we may want to instinctively opt for immutably copying and modifying this data, we're actually allowed to mutate it directly, since it's just a copy of the data that's been read by the cache.
 
    This data may also be null if the cache doesn't 
    actually have enough locally cached information to fulfil the query. This is important because resolvers aren't actually applied to cache methods in updaters. All resolvers are ignored, so it becomes impossible to accidentally commit transformed data to our cache. We could safely add a resolver for Todo.createdAt and wouldn't have to worry about an updater accidentally writing it to the cache's internal data structure.
  */
  return cache.updateQuery(qi, (data) => fn(result, data as any) as any);
}
