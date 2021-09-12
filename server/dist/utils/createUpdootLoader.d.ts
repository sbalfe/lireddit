import DataLoader from 'dataloader';
import { Updoot } from '../entities/Updoot';
export declare const createUpdootLoader: () => DataLoader<{
    postId: number;
    userId: number;
}, Updoot | null, {
    postId: number;
    userId: number;
}>;
