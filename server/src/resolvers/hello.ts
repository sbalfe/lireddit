import { Query, Resolver } from "type-graphql";

@Resolver()
export class HelloResolver {

    /* when we query json with a hello it returns this as the data  */
    @Query(() => String) // declare what type the query returns
    hello(){
        return "cock and balls"
    }

}