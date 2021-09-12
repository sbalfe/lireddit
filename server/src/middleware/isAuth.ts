import {MiddlewareFn } from "type-graphql/dist/interfaces/Middleware";
import { MyContext } from "../types";

/* middleware that runs just before the resolver is hit. */
export const isAuth: MiddlewareFn<MyContext> = ({context}, next) => {
  if(!context.req.session.userId){
    throw new Error("not authenticated")
  }
  return next();
}