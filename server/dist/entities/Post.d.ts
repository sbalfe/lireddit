import { BaseEntity } from "typeorm";
import { Updoot } from "./Updoot";
import { User } from "./User";
export declare class Post extends BaseEntity {
    id: number;
    title: string;
    text: string;
    points: number;
    voteStatus: number | null;
    creatorId: number;
    creator: User;
    updoots: Updoot[];
    createdAt: Date;
    updatedAt: Date;
}
