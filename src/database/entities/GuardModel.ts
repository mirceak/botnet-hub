import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class GuardModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  roles: Roles;

  @Column()
  permissions: Permissions;
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
