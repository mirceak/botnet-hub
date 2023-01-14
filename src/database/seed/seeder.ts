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
    name: '@remoteModules/' + moduleBasePath.replace('remote/modules/', '')
  }).then(async (remoteModule) => {
    let code = getFileContentsSync(`build/database/seed/${moduleBasePath}`);
    if (code.includes('<style staticScope>')) {
      const scopedCssMatches = [
        ...code.matchAll(/(<style staticScope>).+?(<\/style staticScope>)/gs)
      ];
      if (scopedCssMatches) {
        for (const scopedCssMatch of scopedCssMatches) {
          const _sass = scopedCssMatch[0]
            .replace(scopedCssMatch[1], '')
            .replace(scopedCssMatch[2], '');
          const parsedSass = sass.renderSync({ data: _sass }).css.toString();
          code = code
            .replace(_sass, parsedSass)
            .replace('<style staticScope>', '')
            .replace('</style staticScope>', '');
        }
      }
    }
    await remoteModule.scriptEntity?.createEntity({
      name: '@remoteModules/' + moduleBasePath.replace('remote/modules/', ''),
      code
    });
  });
};

const loadSeederFile = async <T>(importer: () => Promise<T>) => {
  const fileBasePath = importer
    .toString()
    .match(/import\('.*'\)/g)?.[0]
    .replace("import('", '')
    .replace("')", '')
    .split('./')
    .pop() as string;
  const type = fileBasePath.split('.').pop();
  await RemoteModule.create({
    name:
      '@remoteFiles/' + fileBasePath.split('remote/modules/utils/assets/')[1]
  }).then(async (remoteModule) => {
    let code = getFileContentsSync(
      `${
        'src/database/seed/remote/modules/utils/assets/' +
        fileBasePath.split('@remoteFiles/')[1]
      }`
    );
    switch (type) {
      case 'scss':
        code = sass.renderSync({ data: code }).css.toString();
        break;
    }
    await remoteModule.scriptEntity?.createEntity({
      name:
        '@remoteFiles/' +
        fileBasePath.replace('remote/modules/utils/assets/', ''),
      code
    });
  });
};

export const init: IKernelModuleInit = async (context) => {
  //addAssociations;
  Script.hasMany(Guard);
  RemoteModule.hasMany(Guard);
  Entity.hasMany(Guard);
  Guard.hasMany(Guard, {
    as: 'guardGuards'
  });

  Guard.belongsTo(RemoteModule);
  RemoteModule.hasOne(Script);

  //syncModels
  await context.kernelGlobals.sequelize?.sync();

  //seedEntities;
  await Entity.create({
    name: 'entities'
  });
  await Entity.create({
    name: 'guards'
  });
  await Entity.create({
    name: 'remoteModule'
  });

  //seedRemoteKernel;
  await loadSeederModule(() => import('@remoteModules/mainRemote.js'));
  if (cluster.isPrimary) {
    await loadSeederModule(
      () => import('@remoteModules/backend/express/frontendServer.js')
    );
  }
  await loadSeederModule(
    () => import('@remoteModules/frontend/modules/home/pages/page.Home.js')
  );
  await loadSeederModule(
    () => import('@remoteModules/frontend/modules/home/pages/page.About.js')
  );

  await loadSeederModule(
    () =>
      import(
        '@remoteModules/frontend/modules/not-found/components/page.NotFound.js'
      )
  );

  await loadSeederModule(
    () => import('@remoteModules/frontend/engine/components/Main.js')
  );
  await loadSeederModule(
    () => import('@remoteModules/frontend/engine/router.js')
  );
  await loadSeederModule(
    () => import('@remoteModules/frontend/engine/store.js')
  );

  await loadSeederModule(
    () => import('@remoteModules/utils/reactivity/objectProxy.js')
  );

  await loadSeederModule(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/elements/layout/layout.main.js'
      )
  );
  await loadSeederModule(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/elements/layout/header/header.main.js'
      )
  );
  await loadSeederModule(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/elements/layout/footer/footer.main.js'
      )
  );
  await loadSeederModule(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/elements/layout/nav/left/nav.main.js'
      )
  );
  await loadSeederModule(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/dynamicViews/template/TemplateListView.js'
      )
  );
  await loadSeederModule(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
      )
  );
  await loadSeederModule(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/dynamicViews/router/ProxyRouterView.js'
      )
  );
  await loadSeederModule(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/dynamicViews/html/DynamicHtmlView.js'
      )
  );
  await loadSeederModule(
    () => import('@remoteModules/utils/sharedComponents/form/elements/Input.js')
  );
  await loadSeederModule(
    () =>
      import('@remoteModules/utils/sharedComponents/elements/button/Button.js')
  );

  await loadSeederModule(
    () => import('@remoteModules/backend/workers/jsdom/jsdomWorker.js')
  );

  await loadSeederFile(
    () => import('@remoteFiles/scss/theme/main/layout/layout.main.scss')
  );

  await loadSeederFile(() => import('@remoteFiles/scss/helpers/display.scss'));
  await loadSeederFile(
    () => import('@remoteFiles/scss/theme/main/theme.main.scss')
  );
  await loadSeederFile(() => import('@remoteFiles/scss/helpers/sizing.scss'));
};
