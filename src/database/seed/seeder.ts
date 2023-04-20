import { RemoteModuleModel } from '#database/entities/RemoteModuleModel.js';
import { ScriptModel } from '#database/entities/ScriptModel.js';
import { UserModel } from '#database/entities/UserModel.js';
import type { IKernel, IKernelModuleInit } from '#src/kernel/Kernel.js';
import { getFileContentsSync } from '#helpers/imports/io.js';
import cluster from 'cluster';
import sass from 'sass';
import path from 'path';

const loadSeederModule = async <T>(
  context: IKernel,
  importer: () => Promise<T>
) => {
  const moduleBasePath = importer
    .toString()
    .replaceAll(/\/src\/database\/seed\/remote\/modules\//g, '/remoteModules')
    .replaceAll(/[\n\r\t ]/g, '')
    .match(/import\(.*\)/g)?.[0]
    .replace("import('", '')
    .replace("')", '')
    .split('./')
    .pop() as string;

  const code = getFileContentsSync(
    moduleBasePath.replace(
      /\/remoteModules/gs,
      'build/database/seed/remote/modules/'
    )
  );

  const script = new ScriptModel();
  script.name = moduleBasePath.replace('/', '#');
  script.code = code;

  const remoteModule = new RemoteModuleModel();
  remoteModule.name = moduleBasePath.replace('/', '#');
  remoteModule.script = script;

  await context.kernelGlobals.dataSource?.manager.save([script, remoteModule]);
};

const loadSeederFile = async <T>(
  context: IKernel,
  importer: () => Promise<T>
) => {
  const fileBasePath = importer
    .toString()
    .replaceAll(/[\n\r\t ]/g, '')
    .match(/import\(.*\)/g)?.[0]
    .replace("import('", '')
    .replace("')", '')
    .split('./')
    .pop() as string;
  const type = fileBasePath.split('.').pop();
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
                return new URL('file://' + path.resolve('.', url));
              }
            }
          ]
        })
        .css.toString();
      break;
  }

  const script = new ScriptModel();
  script.name = fileBasePath.replace('/', '#');
  script.code = code;

  const remoteModule = new RemoteModuleModel();
  remoteModule.name = fileBasePath.replace('/', '#');
  remoteModule.script = script;

  await context.kernelGlobals.dataSource?.manager.save([script, remoteModule]);
};

export const init: IKernelModuleInit = async (context) => {
  const user1 = new UserModel();
  user1.name = 'Mircea Bereveanu';
  user1.email = 'mircea.bereveanu.office@gmail.com';
  user1.password = 'qwer1234';

  const user2 = new UserModel();
  user2.name = 'Mircea Bereveanu Guest';
  user2.email = 'mircea.bereveanu@gmail.com';
  user2.password = 'qwer1234';

  // await User.create({
  //   name: 'Mircea Bereveanu',
  //   email: 'mircea.bereveanu.office@gmail.com'
  // }).then(async (user) => {
  //   await user.guardEntities?.createEntity({
  //     name: 'kernel/admin',
  //     permissions: [0, 1, 2, 3],
  //     roles: [0, 1]
  //   });
  // });
  //
  // await User.create({
  //   name: 'Mircea Bereveanu Guest',
  //   email: 'mircea.bereveanu@gmail.com'
  // }).then(async (user) => {
  //   await user.guardEntities?.createEntity({
  //     name: 'web/guest',
  //     permissions: [1],
  //     roles: [1]
  //   });
  // });

  await context.kernelGlobals.dataSource?.manager.save([user1, user2]);

  //seedRemoteKernel;
  await loadSeederModule(context, () => import('/remoteModules/mainRemote.js'));
  if (cluster.isPrimary) {
    await loadSeederModule(
      context,
      () => import('/remoteModules/backend/express/frontendServer.js')
    );
  }
  await loadSeederModule(
    context,
    () => import('/remoteModules/frontend/modules/home/pages/page.Home.js')
  );
  await loadSeederModule(
    context,
    () => import('/remoteModules/frontend/modules/home/pages/page.About.js')
  );
  await loadSeederModule(
    context,
    () => import('/remoteModules/frontend/modules/auth/pages/page.Auth.js')
  );
  await loadSeederModule(
    context,
    () =>
      import(
        '/remoteModules/frontend/modules/home/pages/dev/page.Components.js'
      )
  );
  await loadSeederModule(
    context,
    () => import('/remoteModules/frontend/modules/not-found/page.NotFound.js')
  );

  await loadSeederModule(
    context,
    () => import('/remoteModules/frontend/engine/components/Main.js')
  );
  await loadSeederModule(
    context,
    () => import('/remoteModules/frontend/engine/router.js')
  );
  await loadSeederModule(
    context,
    () => import('/remoteModules/frontend/engine/store.js')
  );

  await loadSeederModule(
    context,
    () => import('/remoteModules/utils/reactivity/objectProxy.js')
  );

  await loadSeederModule(
    context,
    () => import('/remoteModules/services/models/User/model.User.js')
  );

  await loadSeederModule(
    context,
    () =>
      import(
        '/remoteModules/utils/helpers/shared/transformations/validations.proto.js'
      )
  );

  await loadSeederModule(
    context,
    () =>
      import(
        '/remoteModules/utils/helpers/shared/transformations/reducers.functions.js'
      )
  );

  await loadSeederModule(
    context,
    () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/layout/main/layout.main.js'
      )
  );
  await loadSeederModule(
    context,
    () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/layout/main/header/header.main.js'
      )
  );
  await loadSeederModule(
    context,
    () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/layout/main/footer/footer.main.js'
      )
  );
  await loadSeederModule(
    context,
    () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/layout/main/nav/left/nav.main.js'
      )
  );
  await loadSeederModule(
    context,
    () =>
      import(
        '/remoteModules/frontend/engine/components/shared/dynamicViews/router/RouterView.js'
      )
  );
  await loadSeederModule(
    context,
    () =>
      import(
        '/remoteModules/frontend/engine/components/shared/dynamicViews/router/ProxyRouterView.js'
      )
  );
  await loadSeederModule(
    context,
    () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/form/inputs/element.form.input.js'
      )
  );
  await loadSeederModule(
    context,
    () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/form/inputs/element.form.select.js'
      )
  );
  await loadSeederModule(
    context,
    () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/form/element.form.button.js'
      )
  );

  await loadSeederModule(
    context,
    () => import('/remoteModules/backend/workers/jsdom/jsdomWorker.js')
  );

  await loadSeederFile(
    context,
    () => import('/remoteModules/utils/assets/scss/theme/main/theme.main.scss')
  );
  await loadSeederFile(
    context,
    () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/layout/main/header/header.main.scss'
      )
  );
  await loadSeederFile(
    context,
    () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/layout/main/nav/left/nav.main.scss'
      )
  );
  await loadSeederFile(
    context,
    () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/layout/main/footer/footer.main.scss'
      )
  );
  await loadSeederFile(
    context,
    () => import('/remoteModules/frontend/modules/home/pages/page.About.scss')
  );
  await loadSeederFile(
    context,
    () => import('/remoteModules/frontend/modules/auth/pages/page.Auth.scss')
  );
  await loadSeederFile(
    context,
    () =>
      import(
        '/remoteModules/frontend/modules/home/pages/dev/page.Components.scss'
      )
  );
  await loadSeederFile(
    context,
    () => import('/remoteModules/frontend/modules/home/pages/page.Home.scss')
  );
};
