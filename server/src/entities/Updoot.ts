

import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Post } from "./Post";
import { User } from "./User";


/* many to many relationship */

/* user -> updoot < */

@ObjectType()
@Entity()
export class Updoot extends BaseEntity {

  @Field(() => Int)
  @Column({type: "int"})
  value!: number;

  @Field(() => Int)
  @PrimaryColumn()
  userId!: number;
  
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.updoots)
  user!: User;


  @PrimaryColumn()
  postId!: number;

  @ManyToOne(() => Post, (post) => post.updoots, {
    onDelete: 'CASCADE' /* integrity when a post is deleted, it also deletes the updoot */
  })
  post!: Post;

}