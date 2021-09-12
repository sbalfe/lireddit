import DataLoader from 'dataloader';
import { User } from '../entities/User';

// [1, 78, 7, 9] 
// returns user for each one of th+e keys [{id: 1 , username: "cunt "} , ...]
export const createUserLoader = () => new DataLoader<number, User>(async (userIds) => {
  const users = await User.findByIds(userIds as number[]);
  const userIdToUser: Record<number, User> = {};

  users.forEach(u => {
    userIdToUser[u.id] = u;
  })

  return userIds.map(userId => userIdToUser[userId]) /* fill up userids using the key value pairs, maps the ids to a user. */
});