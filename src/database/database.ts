import { Sequelize } from 'sequelize';
import { type IKernelModuleInit } from '@kernel/Kernel.js';

export const init: IKernelModuleInit = async (context) => {
  context.globals.sequelize = new Sequelize('sqlite::memory:', {
    typeValidation: true,
  });
  await context.runImports([
    import('@database/entities/Script.js'),
    import('@database/entities/Composable.js'),
    import('@database/entities/Guard.js'),
    import('@database/entities/Entity.js'),
  ]);
};

//add routes for express static
//add puppeteer for ssr
//add routes for front-end
//add routes for api
