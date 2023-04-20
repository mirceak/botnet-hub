import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class GuardModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'text',
    transformer: {
      from: (value: string) => value.split(','),
      to: (value: string[]) => value.join(',')
    }
  })
  roles: Roles[];

  @Column({
    type: 'text',
    transformer: {
      from: (value: string) => value.split(','),
      to: (value: string[]) => value.join(',')
    }
  })
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
