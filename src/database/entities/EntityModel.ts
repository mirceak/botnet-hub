import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class EntityModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  name: string;
}
