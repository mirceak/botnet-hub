import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  type Sequelize
} from 'sequelize';
import { type IKernelModuleInit } from '@src/kernel/Kernel.js';
import { type Guard } from './Guard.js';
import {
  type HasManyMixin,
  useHasManyMixin
} from '@database/entities/mixins/HasManyMixin.js';

export class User extends Model<
  InferAttributes<User, { omit: 'guardEntities' }>,
  InferCreationAttributes<User, { omit: 'guardEntities' }>
> {
  declare name: string;
  declare email: string;
  declare emailHash?: string;
  declare password?: string;
  declare passwordHash?: string;

  declare guardEntities?: HasManyMixin<Guard>;

  constructor(...attrs: never[]) {
    super(...attrs);
    this.guardEntities = useHasManyMixin<User, Guard>(this, 'Guard');
  }
}

export const init: IKernelModuleInit = (context) => {
  User.init(
    {
      name: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING },
      emailHash: { type: DataTypes.STRING, allowNull: true },
      password: { type: DataTypes.STRING, allowNull: true },
      passwordHash: { type: DataTypes.STRING, allowNull: true }
    },
    {
      sequelize: context.kernelGlobals.sequelize as Sequelize,
      modelName: 'user'
    }
  );
};
