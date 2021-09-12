import { FieldError } from "../generated/graphql";

/* takes in an array of errors from graphql,
    
    iterates over them and creates a record i.e. dictionary object to return as the errorMap

*/
export const toErrorMap = (errors: FieldError[]) => {

    const errorMap: Record<string, string> = {};

    errors.forEach(({field, message}) => {
        errorMap[field] = message;
    }) 

    return errorMap;
}