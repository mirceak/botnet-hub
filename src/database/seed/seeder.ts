import { Entity } from '#database/entities/Entity.js';
import { Guard } from '#database/entities/Guard.js';
import { RemoteModule } from '#database/entities/RemoteModule.js';
import { Script } from '#database/entities/Script.js';
import { User } from '#database/entities/User.js';
import { WebComponent } from '#database/entities/WebComponent.js';
import type { IKernelModuleInit } from '#src/kernel/Kernel.js';
import { getFileContentsSync } from '#helpers/imports/io.js';
import cluster from 'cluster';
import sass from 'sass';
import path from 'path';

const loadSeederModule = async <T>(importer: () => Promise<T>) => {
  const moduleBasePath = importer
    .toString()
    .replaceAll(/[\n\r\t ]/g, '')
    .match(/import\(.*\)/g)?.[0]
    .replace("import('", '')
    .replace("')", '')
    .split('./')
    .pop() as string;
  await RemoteModule.create({
    name: moduleBasePath.replace('/', '#')
  }).then(async (remoteModule) => {
    const code = getFileContentsSync(
      moduleBasePath.replace(
        /\/remoteModules/gs,
        'build/database/seed/remote/modules/'
      )
    );
    await remoteModule.scriptEntity?.createEntity({
      name: moduleBasePath.replace('/', '#'),
      code
    });
  });
};

const loadSeederFile = async <T>(importer: () => Promise<T>) => {
  const fileBasePath = importer
    .toString()
    .replaceAll(/[\n\r\t ]/g, '')
    .match(/import\(.*\)/g)?.[0]
    .replace("import('", '')
    .replace("')", '')
    .split('./')
    .pop() as string;
  const type = fileBasePath.split('.').pop();
  await RemoteModule.create({
    name: fileBasePath.replace('/', '#')
  }).then(async (remoteModule) => {
    let code = getFileContentsSync(
      `${
        'src/database/seed/remote/modules/' +
        fileBasePath.split('/remoteModules/')[1]
      }`
    );
    switch (type) {
      case 'scss':
        code = sass
          .compileString(code, {
            importers: [
              {
                findFileUrl(url: string) {
                  if (/^[a-z]+:/i.test(url)) return null;
                  return new URL('file://' + path.resolve('src', url));
                }
              }
            ]
          })
          .css.toString();
        break;
    }
    await remoteModule.scriptEntity?.createEntity({
      name: fileBasePath.replace('/', '#'),
      code
    });
  });
};

export const init: IKernelModuleInit = async (context) => {
  //addAssociations;
  Script.hasMany(Guard);
  User.hasMany(Guard);
  RemoteModule.hasMany(Guard);
  Entity.hasMany(Guard);
  WebComponent.hasMany(Guard);
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
  await Entity.create({
    name: 'users'
  });
  await Entity.create({
    name: 'webComponent'
  });

  await User.create({
    name: 'Mircea Bereveanu',
    email: 'mircea.bereveanu.office@gmail.com'
  }).then(async (user) => {
    await user.guardEntities?.createEntity({
      name: 'kernel/admin',
      permissions: [0, 1, 2, 3],
      roles: [0, 1]
    });
  });

  await User.create({
    name: 'Mircea Bereveanu Guest',
    email: 'mircea.bereveanu@gmail.com'
  }).then(async (user) => {
    await user.guardEntities?.createEntity({
      name: 'web/guest',
      permissions: [1],
      roles: [1]
    });
  });

  //seedRemoteKernel;
  await loadSeederModule(() => import('/remoteModules/mainRemote.js'));
  if (cluster.isPrimary) {
    await loadSeederModule(
      () => import('/remoteModules/backend/express/frontendServer.js')
    );
  }
  await loadSeederModule(
    () => import('/remoteModules/frontend/modules/home/pages/page.Home.js')
  );
  await loadSeederModule(
    () => import('/remoteModules/frontend/modules/home/pages/page.About.js')
  );
  await loadSeederModule(
    () => import('/remoteModules/frontend/modules/auth/pages/page.Auth.js')
  );
  await loadSeederModule(
    () =>
      import(
        '/remoteModules/frontend/modules/home/pages/dev/page.Components.js'
      )
  );
  await loadSeederModule(
    () => import('/remoteModules/frontend/modules/not-found/page.NotFound.js')
  );

  await loadSeederModule(
    () => import('/remoteModules/frontend/engine/components/Main.js')
  );
  await loadSeederModule(
    () => import('/remoteModules/frontend/engine/router.js')
  );
  await loadSeederModule(
    () => import('/remoteModules/frontend/engine/store.js')
  );

  await loadSeederModule(
    () => import('/remoteModules/utils/reactivity/objectProxy.js')
  );

  await loadSeederModule(
    () => import('/remoteModules/utils/helpers/shared/utils.js')
  );

  await loadSeederModule(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/layout/main/layout.main.js'
      )
  );
  await loadSeederModule(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/layout/main/header/header.main.js'
      )
  );
  await loadSeederModule(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/layout/main/footer/footer.main.js'
      )
  );
  await loadSeederModule(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/layout/main/nav/left/nav.main.js'
      )
  );
  await loadSeederModule(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/dynamicViews/template/TemplateListView.js'
      )
  );
  await loadSeederModule(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
      )
  );
  await loadSeederModule(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/dynamicViews/router/ProxyRouterView.js'
      )
  );
  await loadSeederModule(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/dynamicViews/html/DynamicHtmlView.js'
      )
  );
  await loadSeederModule(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/form/inputs/element.form.input.js'
      )
  );
  await loadSeederModule(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/form/inputs/element.form.select.js'
      )
  );
  await loadSeederModule(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
      )
  );

  await loadSeederModule(
    () => import('/remoteModules/backend/workers/jsdom/jsdomWorker.js')
  );

  await loadSeederFile(
    () => import('/remoteModules/utils/assets/scss/theme/main/theme.main.scss')
  );
  await loadSeederFile(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/layout/main/header/header.main.scss'
      )
  );
  await loadSeederFile(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/layout/main/nav/left/nav.main.scss'
      )
  );
  await loadSeederFile(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/layout/main/footer/footer.main.scss'
      )
  );
  await loadSeederFile(
    () => import('/remoteModules/frontend/modules/home/pages/page.About.scss')
  );
  await loadSeederFile(
    () => import('/remoteModules/frontend/modules/auth/pages/page.Auth.scss')
  );
  await loadSeederFile(
    () =>
      import(
        '/remoteModules/frontend/modules/home/pages/dev/page.Components.scss'
      )
  );
  await loadSeederFile(
    () => import('/remoteModules/frontend/modules/home/pages/page.Home.scss')
  );
};
