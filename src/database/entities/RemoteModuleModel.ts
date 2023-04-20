import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { ScriptModel } from '#database/entities/ScriptModel.js';

@Entity()
export class RemoteModuleModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  name: string;

  @OneToOne(() => ScriptModel, { cascade: true, eager: true })
  @JoinColumn()
  script: ScriptModel;
}
