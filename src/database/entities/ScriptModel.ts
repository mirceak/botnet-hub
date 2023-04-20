import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ScriptModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  name: string;

  @Column()
  code: string;
}
