import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
} from 'sequelize';
import { type IKernelModuleInit } from '@src/kernel/Kernel.js';
import {
  type HasManyMixin,
  useHasManyMixin,
} from '@kernel/composables/HasManyMixin.js';
import {
  type HasOneMixin,
  useHasOneMixin,
} from '@kernel/composables/HasOneMixin.js';
import { type Composable } from './Composable.js';

export class Guard extends Model<
  InferAttributes<Guard, { omit: 'guardEntities' | 'composableEntity' }>,
  InferCreationAttributes<Guard, { omit: 'guardEntities' | 'composableEntity' }>
> {
  declare name: string;
  declare roles: Roles[];
  declare permissions: Permissions[];

  declare guardEntities?: HasManyMixin<Guard>;
  declare composableEntity?: HasOneMixin<Composable>;

  constructor(...attrs: unknown[]) {
    super(...attrs);

    this.guardEntities = useHasManyMixin<Guard, Guard>(this, 'GuardGuard');
    this.composableEntity = useHasOneMixin<Guard, Composable>(
      this,
      'Composable',
    );
  }
}

export enum Permissions {
  'create',
  'read',
  'update',
  'delete',
}

export enum Roles {
  'admin',
  'guest',
}

export const init: IKernelModuleInit = async (context) => {
  await Guard.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true,
      },
      roles: {
        type: DataTypes.ARRAY(
          DataTypes.ENUM({
            values: Object.keys(Roles),
          }),
        ),
      },
      permissions: {
        type: DataTypes.ARRAY(
          DataTypes.ENUM({
            values: Object.keys(Permissions),
          }),
        ),
      },
    },
    { sequelize: context.kernelGlobals.sequelize, modelName: 'guard' },
  );
};
