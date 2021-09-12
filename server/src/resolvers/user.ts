import { Arg, Ctx, Field, FieldResolver, InputType, Mutation, ObjectType, Query, Resolver, Root } from "type-graphql";
import { User } from "../entities/User";
import { MyContext } from "../types";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "../utils/usernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { validate } from "graphql";
import { sendEmail } from "../utils/sendEmail";
import {v4} from 'uuid';
import { EMFILE } from "constants";
import { getConnection, SimpleConsoleLogger } from "typeorm";
import { UserInputError } from "apollo-server-errors";

/* allows us to define an object to be used as the options input in our graphql */
@ObjectType()
class FieldError{
    @Field(() => String)
    field!: string;
    @Field(() => String)
    message!: string;
}

@ObjectType()
class UserResponse{
    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[]; /* returne either undefined or errors value, vice versa */

    @Field(() => User, {nullable: true})
    user?: User;
}

@Resolver(User)
export class UserResolver {

    @FieldResolver(() => String)
    email(@Root() user: User, @Ctx() {req} : MyContext){
        // this is the current user and you can show them there own email.
        if (req.session.userId === user.id){
            return user.email;
        }

        // you are not the user of this email.
        return ""

    }

    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('token', () => String) token: string,
        @Arg('newPassword',() => String) newPassword: string,
        @Ctx() {redis, req}: MyContext
    ): Promise<UserResponse> {
        if (newPassword.length <= 3){
            return {
                errors: [
                  {
                    field: 'newPassword',
                    message: 'password too short, must be > 3'
                  }
              ]
            }
        }

        /* check the token to update password is valid */
        const key = FORGET_PASSWORD_PREFIX+token
        const userId = await redis.get(key);

        if (!userId){
            return {
                errors: [
                    {
                        field: 'token',
                        message: 'token expired'
                    }
                ]
            }
        }

        const userIdNum = parseInt(userId);
        const user = await User.findOne(userIdNum);

        if (!user){
            return {
                errors: [
                    {
                        field: 'token',
                        message: 'user no longer exists'
                    }
                ]
            }
        }

       
        await User.update(
            {
                id: userIdNum
            },
            {
                password: await argon2.hash(newPassword)
            }
        );

        await redis.del(key); /* remove token so you cannot reset again with same one. */

        // log in after change password
        req.session.userId = user.id;
        return {user};
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email", () => String) email: string,
        @Ctx() {redis}: MyContext
    ): Promise<Boolean>{
        const user = await User.findOne({where: {email}}) 
        if (!user){
            /* email not in the database, return true to not notify the user doesnt exist. */
            return true;
        }
        const token = v4(); /* generate random token from uuid */

        /* set redis key value pair, with ex to make sure it expires after 3 days. */
        await redis.set (
            FORGET_PASSWORD_PREFIX + token,
            user.id ,
            'ex', 
            1000 * 60 * 60 * 24 * 3
        );

        /* send unique token to reset password */
        await sendEmail(
            email, 
            `<a href = "http://localhost:3000/change-password/${token}">reset password</a>` /* implement this route to reset. */
        );

        return false
    }

    @Query(() => User, {nullable: true})
    me (
        @Ctx() {req}: MyContext
    ): Promise<User | undefined> | null{
        // not loggged in
        if (!req.session.userId){
            return null
        }
      
        return User.findOne(req.session.userId);
    }

    @Mutation (() => UserResponse)
    async register(
        @Arg('options', () => UsernamePasswordInput ) options: UsernamePasswordInput,
        @Ctx() {req}: MyContext
    ): Promise<UserResponse>{
        const errors = validateRegister(options);
        if (errors){
            /* return error object from validate register with the specified list of errors  */
            return {errors}
        }
        const hashedPassword = await argon2.hash(options.password)
        let user;
        try{

            /* cast to this type, em as entity manager  */
          
            const result = await getConnection().createQueryBuilder().insert().into(User).values([{
                username: options.username,
                email: options.email,
                password: hashedPassword
            }]).returning('*').execute();

            user = result.raw[0]

        } catch(err: any ) {
            if (err.code === '23505' || err.detail.includes("already exists")){
               return {
                   errors: [{
                       field: 'username or email',
                       message: 'that username or email already exists'
                   }]
               }
            }    
            
        }
        req.session.userId = user.id;

        console.log(user);
        return {user};
    }

    @Mutation (() => UserResponse)
    async login(
        @Arg('usernameOrEmail', () => String) usernameOrEmail: string,
        @Arg('password', () => String) password: string,
        @Ctx() { req}: MyContext
    ): Promise<UserResponse>{
    

        const user = await User.findOne(
            usernameOrEmail.includes('@') ? 
            {where : {email : usernameOrEmail}} 
            : {where: {username: usernameOrEmail}}
        )
    
        if (!user){
            return {
                errors: [{
                    field: 'usernameOrEmail',
                    message: 'username does not exist'
                }],
            };
        }

        const valid = await argon2.verify(user.password, password);

        if (!valid){
     
            return {
                errors: [{
                    field: 'password',
                    message: 'Incorrect password'
                }],
            };
        }


        req.session.userId = user.id;
        console.log(user);
        return { user }
    }

    @Mutation(() => Boolean)
    logout(
        @Ctx() {req, res}: MyContext
    ) {
        /* return the promise when they logout which signals if logout was succesful. deletes the redis session. */
    
        console.log(req.session.userId)
        return new Promise(
            resolve => req.session.destroy(err => {

                /*  wipe cookie with teh data stored in environment variable.*/
        
                res.clearCookie(COOKIE_NAME);
                if (err) {
                    console.log(err);
                    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve
                    resolve(false); /* respond with an error in the promise  */
                    return;
                } 
                
                resolve(true) /* respond the promise with a success */
            })
        )
    }

}