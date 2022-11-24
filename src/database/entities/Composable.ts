import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
} from 'sequelize';
import { type IKernelModuleInit } from '@src/kernel/Kernel.js';
import { type Guard } from './Guard.js';
import {
  type HasManyMixin,
  useHasManyMixin,
} from '@kernel/composables/HasManyMixin.js';
import {
  type HasOneMixin,
  useHasOneMixin,
} from '@kernel/composables/HasOneMixin.js';
import { type Script } from './Script.js';

export class Composable extends Model<
  InferAttributes<Composable, { omit: 'scriptEntity' | 'guardEntities' }>,
  InferCreationAttributes<
    Composable,
    { omit: 'scriptEntity' | 'guardEntities' }
  >
> {
  declare name: string;

  declare guardEntities?: HasManyMixin<Guard>;
  declare scriptEntity?: HasOneMixin<Script>;

  constructor(...attrs: unknown[]) {
    super(...attrs);
    this.guardEntities = useHasManyMixin<Composable, Guard>(this, 'Guard');
    this.scriptEntity = useHasOneMixin<Composable, Script>(this, 'Script');
  }
}

export const init: IKernelModuleInit = async (context) => {
  await Composable.init(
    {
      name: { type: DataTypes.STRING },
    },
    { sequelize: context.kernelGlobals.sequelize, modelName: 'composable' },
  );
};
