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
//rename remoteModule entity to remoteModule entity

//add webComponent entity
//add webTemplate entity
//add webModule entity
//add webStyle entity

//web components
//components declare what components get used to fill in slots

//web page
//contains the router logic, minimum components required to activate static html and the relevant css
//layouts component
//input field

//add routes for express static
//add routes for front-end
//add routes for api
