import DataLoader from 'dataloader';
import { User } from '../entities/User';
export declare const createUserLoader: () => DataLoader<number, User, number>;
