import { User } from "../entities/User";
import { MyContext } from "../types";
import { UsernamePasswordInput } from "../utils/usernamePasswordInput";
declare class FieldError {
    field: string;
    message: string;
}
declare class UserResponse {
    errors?: FieldError[];
    user?: User;
}
export declare class UserResolver {
    email(user: User, { req }: MyContext): string;
    changePassword(token: string, newPassword: string, { redis, req }: MyContext): Promise<UserResponse>;
    forgotPassword(email: string, { redis }: MyContext): Promise<Boolean>;
    me({ req }: MyContext): Promise<User | undefined> | null;
    register(options: UsernamePasswordInput, { req }: MyContext): Promise<UserResponse>;
    login(usernameOrEmail: string, password: string, { req }: MyContext): Promise<UserResponse>;
    logout({ req, res }: MyContext): Promise<unknown>;
}
export {};
