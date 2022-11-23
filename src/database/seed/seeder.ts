import { Entity } from '@database/entities/Entity.js';
import { Guard } from '@database/entities/Guard.js';
import { Composable } from '@database/entities/Composable.js';
import { Script } from '@database/entities/Script.js';
import type { IKernelModuleInit } from '@src/kernel/Kernel.js';
import { getFileContentsSync } from '@helpers/imports/io.js';

const loadSeederModule = async (moduleBasePath: string, moduleName: string) => {
  await Composable.create({
    name: moduleName,
  }).then(async (composable) => {
    await composable.scriptEntity.createEntity({
      name: moduleBasePath + '/' + moduleName,
      code: getFileContentsSync(`database/seed/remote/modules/mainRemote.js`),
    });
  });
};

export const init: IKernelModuleInit = async (context) => {
  //addAssociations;
  Script.hasMany(Guard);
  Composable.hasMany(Guard);
  Entity.hasMany(Guard);
  Guard.hasMany(Guard, {
    as: 'guardGuards',
  });

  Guard.belongsTo(Composable);
  Composable.hasOne(Script);

  //syncModels
  await context.globals.sequelize.sync();

  //seedEntities;
  await Entity.create({
    name: 'entities',
  });
  await Entity.create({
    name: 'guards',
  });
  await Entity.create({
    name: 'composables',
  });
  await Entity.create({
    name: 'scripts',
  });

  //seedRemoteKernel;
  await loadSeederModule('modules', 'mainRemote');
};
