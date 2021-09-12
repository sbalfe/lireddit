import DataLoader from 'dataloader';
import { Updoot } from '../entities/Updoot';
import { User } from '../entities/User';


export const createUpdootLoader = () => new DataLoader<{postId: number; userId: number }, Updoot | null>(async (keys) => {

  const updoots = await Updoot.findByIds(keys as any);
  const updootIdsToUpdoot: Record<string, Updoot> = {}; /* generic type of keys to take in and return value */

  updoots.forEach(updoot => {
    updootIdsToUpdoot[`${updoot.userId}|${updoot.postId}`] = updoot;
  })

  return keys.map((key) => updootIdsToUpdoot[`${key.userId}|${key.postId}`]);
});