import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  type Sequelize,
} from 'sequelize';
import { type IKernelModuleInit } from '@src/kernel/Kernel.js';
import {
  type HasManyMixin,
  useHasManyMixin,
} from '@database/entities/mixins/HasManyMixin.js';
import {
  type HasOneMixin,
  useHasOneMixin,
} from '@database/entities/mixins/HasOneMixin.js';
import { type RemoteModule } from './RemoteModule.js';

export class Guard extends Model<
  InferAttributes<Guard, { omit: 'guardEntities' | 'remoteModuleEntity' }>,
  InferCreationAttributes<
    Guard,
    { omit: 'guardEntities' | 'remoteModuleEntity' }
  >
> {
  declare name: string;
  declare roles: Roles[];
  declare permissions: Permissions[];

  declare guardEntities?: HasManyMixin<Guard>;
  declare remoteModuleEntity?: HasOneMixin<RemoteModule>;

  constructor(...attrs: never[]) {
    super(...attrs);

    this.guardEntities = useHasManyMixin<Guard, Guard>(this, 'GuardGuard');
    this.remoteModuleEntity = useHasOneMixin<Guard, RemoteModule>(
      this,
      'remoteModule',
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
    {
      sequelize: context.kernelGlobals.sequelize as Sequelize,
      modelName: 'guard',
    },
  );
};
