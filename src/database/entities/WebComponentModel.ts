import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class WebComponentModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  script: string;
}
