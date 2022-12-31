import { Sequelize } from 'sequelize';
import { type IKernelModuleInit } from '@kernel/Kernel.js';

export const init: IKernelModuleInit = async (context) => {
  context.kernelGlobals.sequelize = new Sequelize('sqlite::memory:', {
    typeValidation: true,
  });
  await context.runImports([
    import('@database/entities/Script.js'),
    import('@database/entities/RemoteModule.js'),
    import('@database/entities/Guard.js'),
    import('@database/entities/Entity.js'),
  ]);
};

//move express in mainRemote.ts (not a bot functionality)

//add webComponent entity
//add webModule entity
//add webStyle entity

//web components
//components declare what components get used to fill in slots

//add routes for express static
//add routes for front-end
//add routes for api
