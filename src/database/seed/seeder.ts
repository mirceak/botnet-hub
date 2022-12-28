import { Entity } from '@database/entities/Entity.js';
import { Guard } from '@database/entities/Guard.js';
import { RemoteModule } from '@database/entities/RemoteModule.js';
import { Script } from '@database/entities/Script.js';
import type { IKernelModuleInit } from '@src/kernel/Kernel.js';
import { getFileContentsSync } from '@helpers/imports/io.js';
import cluster from 'cluster';
import sass from 'sass';

const loadSeederModule = async <T>(importer: () => Promise<T>) => {
  const moduleBasePath = importer
    .toString()
    .match(/import\('.*'\)/g)?.[0]
    .replace("import('", '')
    .replace("')", '')
    .split('./')
    .pop() as string;
  await RemoteModule.create({
    name: '@remoteModules/' + moduleBasePath.replace('remote/modules/', ''),
  }).then(async (remoteModule) => {
    let code = getFileContentsSync(`build/database/seed/${moduleBasePath}`);
    if (code.includes('<style staticScope lang="sass">')) {
      const scopedCssMatches = [
        ...code.matchAll(
          /(<style staticScope lang="sass">).+?(<\/style staticScope>)/gs,
        ),
      ];
      if (scopedCssMatches) {
        for (const scopedCssMatch of scopedCssMatches) {
          const _sass = scopedCssMatch[0]
            .replace(scopedCssMatch[1], '')
            .replace(scopedCssMatch[2], '');
          const parsedSass = sass.renderSync({ data: _sass }).css.toString();
          code = code.replace(_sass, parsedSass);
        }
      }
    }
    await remoteModule.scriptEntity?.createEntity({
      name: '@remoteModules/' + moduleBasePath.replace('remote/modules/', ''),
      code,
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
  await context.kernelGlobals.sequelize?.sync();

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
  await loadSeederModule(() => import('@remoteModules/mainRemote.js'));
  if (cluster.isPrimary) {
    await loadSeederModule(
      () => import('@remoteModules/backend/express/frontendServer.js'),
    );
  }
  await loadSeederModule(
    () => import('@remoteModules/frontend/modules/home/pages/page.Home.js'),
  );
  await loadSeederModule(
    () => import('@remoteModules/frontend/modules/home/pages/page.About.js'),
  );

  await loadSeederModule(
    () =>
      import(
        '@remoteModules/frontend/modules/not-found/components/page.NotFound.js'
      ),
  );

  await loadSeederModule(
    () => import('@remoteModules/frontend/engine/components/Main.js'),
  );
  await loadSeederModule(
    () => import('@remoteModules/frontend/engine/router.js'),
  );
  await loadSeederModule(
    () => import('@remoteModules/frontend/engine/store.js'),
  );

  await loadSeederModule(
    () => import('@remoteModules/utils/reactivity/objectProxy.js'),
  );

  await loadSeederModule(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/elements/layouts/layout.main.js'
      ),
  );
  await loadSeederModule(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
      ),
  );
  await loadSeederModule(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/dynamicViews/router/ProxyRouterView.js'
      ),
  );
  await loadSeederModule(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/dynamicViews/html/DynamicHtmlView.js'
      ),
  );
  await loadSeederModule(
    () =>
      import('@remoteModules/utils/sharedComponents/form/elements/Input.js'),
  );
  await loadSeederModule(
    () =>
      import('@remoteModules/utils/sharedComponents/elements/button/Button.js'),
  );

  await loadSeederModule(
    () => import('@remoteModules/backend/workers/jsdom/jsdomWorker.js'),
  );
};
