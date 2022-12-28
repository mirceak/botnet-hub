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

export class Script extends Model<
  InferAttributes<Script, { omit: 'guardEntities' }>,
  InferCreationAttributes<Script, { omit: 'guardEntities' }>
> {
  declare name: string;
  declare code: string;

  declare guardEntities?: HasManyMixin<Guard>;

  constructor(...attrs: never[]) {
    super(...attrs);
    this.guardEntities = useHasManyMixin<Script, Guard>(this, 'Guard');
  }
}

export const init: IKernelModuleInit = async (context) => {
  await Script.init(
    {
      name: { type: DataTypes.STRING },
      code: { type: DataTypes.STRING },
    },
    {
      sequelize: context.kernelGlobals.sequelize as Sequelize,
      modelName: 'script',
    },
  );
};
