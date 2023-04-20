// import {
//   DataTypes,
//   type InferAttributes,
//   type InferCreationAttributes,
//   type Sequelize,
//   Model
// } from 'sequelize';
// import { type IKernelModuleInit } from '#src/kernel/Kernel.js';
// import { type Guard } from './Guard.js';
// import {
//   type HasManyMixin,
//   useHasManyMixin
// } from '#database/entities/mixins/HasManyMixin.js';
// import {
//   type HasOneMixin,
//   useHasOneMixin
// } from '#database/entities/mixins/HasOneMixin.js';
// import { type Script } from './Script.js';
//
// export class RemoteModule extends Model<
//   InferAttributes<RemoteModule, { omit: 'scriptEntity' | 'guardEntities' }>,
//   InferCreationAttributes<
//     RemoteModule,
//     { omit: 'scriptEntity' | 'guardEntities' }
//   >
// > {
//   declare name: string;
//
//   declare guardEntities?: HasManyMixin<Guard>;
//   declare scriptEntity?: HasOneMixin<Script>;
//
//   constructor(...attrs: never[]) {
//     super(...attrs);
//     this.guardEntities = useHasManyMixin<RemoteModule, Guard>(this, 'Guard');
//     this.scriptEntity = useHasOneMixin<RemoteModule, Script>(this, 'Script');
//   }
// }
//
// export const init: IKernelModuleInit = (context) => {
//   RemoteModule.init(
//     {
//       name: { type: DataTypes.STRING }
//     },
//     {
//       sequelize: context.kernelGlobals.sequelize as Sequelize,
//       modelName: 'remoteModule'
//     }
//   );
// };
