import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  type Sequelize
} from 'sequelize';
import { type IKernelModuleInit } from '#src/kernel/Kernel.js';
import { type Guard } from './Guard.js';
import {
  type HasManyMixin,
  useHasManyMixin
} from '#database/entities/mixins/HasManyMixin.js';

export class WebRoute extends Model<
  InferAttributes<WebRoute, { omit: 'guardEntities' }>,
  InferCreationAttributes<WebRoute, { omit: 'guardEntities' }>
> {
  declare name: string;
  declare path: string;

  declare guardEntities?: HasManyMixin<Guard>;

  constructor(...attrs: never[]) {
    super(...attrs);
    this.guardEntities = useHasManyMixin<WebRoute, Guard>(this, 'Guard');
  }
}

export const init: IKernelModuleInit = (context) => {
  WebRoute.init(
    {
      name: { type: DataTypes.STRING },
      path: { type: DataTypes.STRING }
    },
    {
      sequelize: context.kernelGlobals.sequelize as Sequelize,
      modelName: 'webRoute'
    }
  );
};
