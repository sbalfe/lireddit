

import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { UserResolver } from "../resolvers/user";
import { Updoot } from "./Updoot";
import { User } from "./User";

// database table names
@ObjectType() // graphql decorator.
@Entity()
/* extend base entity to allow us to say post.find() etc. */
export class Post extends BaseEntity {

  // these are the columns of our database. 
  // this is our primary key
  @Field(() => Int) // field shows what is exposed to the graphql schema
  @PrimaryGeneratedColumn()
  id!: number;

  // title field
  @Field(() => String)
  @Column() // decorator to define it as a database
  title!: string;

  @Field(() => String)
  @Column() 
  text!: string;

  @Field(() => Int)
  @Column({type: "int", default: 0}) 
  points!: number;

  @Field(() => Int, {nullable: true})
  voteStatus!: number | null; // 1 or -1 or null

  @Field(() => Int)
  @Column()
  creatorId!: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.posts)
  creator!: User;

  @Field(() => Updoot)
  @OneToMany(() => Updoot, (updoot) => updoot.post)
  updoots!: Updoot[];

   // useful fields for creating entities.
  @Field(() => String )
  @CreateDateColumn()
  createdAt!: Date;

  // date when this row was created , the item in it really.
  @Field(() => String )
  @UpdateDateColumn()
  updatedAt!: Date;

}