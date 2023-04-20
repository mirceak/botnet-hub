import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ArrayTransformer } from '#database/helpers/transformers.js';

@Entity()
export class GuardModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column(ArrayTransformer())
  roles: Roles[];

  @Column(ArrayTransformer())
  permissions: Permissions[];
}

export enum Permissions {
  'create',
  'read',
  'update',
  'delete'
}

export enum Roles {
  'admin',
  'guest'
}
