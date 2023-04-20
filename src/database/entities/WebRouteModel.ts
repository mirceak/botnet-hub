import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class WebRouteModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  name: string;

  @Column()
  path: string;
}
