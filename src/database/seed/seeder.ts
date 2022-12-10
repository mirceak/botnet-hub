import { Entity } from '@database/entities/Entity.js';
import { Guard } from '@database/entities/Guard.js';
import { RemoteModule } from '@database/entities/RemoteModule.js';
import { Script } from '@database/entities/Script.js';
import type { IKernelModuleInit } from '@src/kernel/Kernel.js';
import { getFileContentsSync } from '@helpers/imports/io.js';
import cluster from 'cluster';

const loadSeederModule = async (moduleBasePath: string) => {
  await RemoteModule.create({
    name: '@remoteModules/' + moduleBasePath,
  }).then(async (remoteModule) => {
    await remoteModule.scriptEntity.createEntity({
      name: '@remoteModules/' + moduleBasePath,
      code: getFileContentsSync(
        `build/database/seed/remote/modules/${moduleBasePath}`,
      ),
    });
  });
  // await RemoteModule.create({
  //   name: '@remoteModules/' + moduleBasePath + '.map',
  // }).then(async (remoteModule) => {
  //   await remoteModule.scriptEntity.createEntity({
  //     name: '@remoteModules/' + moduleBasePath + '.map',
  //     code: getFileContentsSync(
  //       `build/database/seed/remote/modules/${moduleBasePath}.map`,
  //     ),
  //   });
  // });
};

export const init: IKernelModuleInit = async (context) => {
  //addAssociations;
  Script.hasMany(Guard);
  RemoteModule.hasMany(Guard);
  Entity.hasMany(Guard);
  Guard.hasMany(Guard, {
    as: 'guardGuards',
  });

  Guard.belongsTo(RemoteModule);
  RemoteModule.hasOne(Script);

  //syncModels
  await context.kernelGlobals.sequelize.sync();

  //seedEntities;
  await Entity.create({
    name: 'entities',
  });
  await Entity.create({
    name: 'guards',
  });
  await Entity.create({
    name: 'remoteModule',
  });

  //seedRemoteKernel;
  await loadSeederModule('mainRemote.js');
  if (cluster.isPrimary) {
    await loadSeederModule('backend/express/frontendServer.js');
  }
  await loadSeederModule('frontend/modules/home/components/page.Home.js');

  await loadSeederModule(
    'frontend/modules/not-found/components/page.NotFound.js',
  );

  await loadSeederModule('frontend/engine/components/Main.js');
  await loadSeederModule('frontend/engine/router.js');
  await loadSeederModule('frontend/engine/store.js');

  await loadSeederModule('utils/3rdParty/path-to-regexp/pathToRegexp.js');
  await loadSeederModule('utils/reactivity/objectProxy.js');

  await loadSeederModule('utils/sharedComponents/dynamicViews/DynamicText.js');
  await loadSeederModule('utils/sharedComponents/form/elements/Input.js');

  await loadSeederModule('workers/backend/jsdom/jsdomWorker.js');
};
