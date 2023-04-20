import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class RouteModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  name: string;

  @Column()
  path: string;
}
