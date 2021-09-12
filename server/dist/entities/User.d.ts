import { BaseEntity } from "typeorm";
import { Post } from "./Post";
import { Updoot } from "./Updoot";
export declare class User extends BaseEntity {
    id: number;
    username: string;
    email: string;
    password: string;
    posts: Post[];
    updoots: Updoot[];
    created_at: Date;
    updated_at: Date;
}
