import { Post } from "../entities/Post";
import { User } from "../entities/User";
import { MyContext } from "../types";
declare class PostInput {
    title: string;
    text: string;
}
declare class PaginatedPosts {
    posts: Post[];
    hasMore: boolean;
}
export declare class PostResolver {
    textSnippet(root: Post): string;
    creator(post: Post, { userLoader }: MyContext): Promise<User>;
    voteStatus(post: Post, { updootLoader, req }: MyContext): Promise<number | null>;
    vote(postId: number, value: number, { req }: MyContext): Promise<boolean>;
    posts(limit: number, cursor: string | null, { req }: MyContext, info: any): Promise<PaginatedPosts>;
    post(id: number): Promise<Post | undefined>;
    createPost(input: PostInput, { req }: MyContext): Promise<Post | null>;
    updatePost(id: number, title: string, text: string, { req }: MyContext): Promise<Post | null>;
    deletePost(id: number, { req }: MyContext): Promise<boolean>;
}
export {};
