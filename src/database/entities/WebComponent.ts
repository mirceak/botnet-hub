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
import {
  HasOneMixin,
  useHasOneMixin
} from '#database/entities/mixins/HasOneMixin.js';
import { Script } from '#database/entities/Script.js';

export class WebComponent extends Model<
  InferAttributes<WebComponent, { omit: 'guardEntities' }>,
  InferCreationAttributes<WebComponent, { omit: 'guardEntities' }>
> {
  declare name: string;

  declare guardEntities?: HasManyMixin<Guard>;
  declare scriptEntity?: HasOneMixin<Script>;

  constructor(...attrs: never[]) {
    super(...attrs);
    this.guardEntities = useHasManyMixin<WebComponent, Guard>(this, 'Guard');
    this.scriptEntity = useHasOneMixin<WebComponent, Script>(this, 'Script');
  }
}

export const init: IKernelModuleInit = (context) => {
  WebComponent.init(
    {
      name: { type: DataTypes.STRING }
    },
    {
      sequelize: context.kernelGlobals.sequelize as Sequelize,
      modelName: 'webComponent'
    }
  );
};
