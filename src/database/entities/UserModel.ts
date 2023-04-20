import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { GuardModel } from '#database/entities/GuardModel.js';

@Entity()
export class UserModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => GuardModel, { cascade: true, eager: true })
  @JoinColumn()
  guard: GuardModel;
}
