import { BaseEntity } from "typeorm";
import { Post } from "./Post";
import { User } from "./User";
export declare class Updoot extends BaseEntity {
    value: number;
    userId: number;
    user: User;
    postId: number;
    post: Post;
}
