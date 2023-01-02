import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  type Sequelize,
} from 'sequelize';
import { type IKernelModuleInit } from '@src/kernel/Kernel.js';
import { type Guard } from './Guard.js';
import {
  type HasManyMixin,
  useHasManyMixin,
} from '@database/entities/mixins/HasManyMixin.js';

export class Entity extends Model<
  InferAttributes<Entity, { omit: 'guardEntities' }>,
  InferCreationAttributes<Entity, { omit: 'guardEntities' }>
> {
  declare name: string;

  declare guardEntities?: HasManyMixin<Guard>;

  constructor(...attrs: never[]) {
    super(...attrs);
    this.guardEntities = useHasManyMixin<Entity, Guard>(this, 'Guard');
  }
}

export const init: IKernelModuleInit = async (context) => {
  await Entity.init(
    {
      name: { type: DataTypes.STRING },
    },
    {
      sequelize: context.kernelGlobals.sequelize as Sequelize,
      modelName: 'entity',
    },
  );
};