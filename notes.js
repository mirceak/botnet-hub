const routes = Object.freeze([
  {
    path: '/home',
    requests: [
      {
        path: '@remoteModules/utils/sharedComponents/elements/layout/main/layout.main.js',
        requests: [
          {
            path: '@remoteModules/utils/assets/scss/theme/main/theme.main.scss'
          },
          {
            path: '@remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
          },
          {
            path: '@remoteModules/utils/sharedComponents/elements/layout/main/header/header.main.js',
            requests: [
              {
                path: '@remoteModules/utils/sharedComponents/elements/layout/main/header/header.main.scss'
              }
            ]
          },
          {
            path: '@remoteModules/utils/sharedComponents/elements/layout/main/footer/footer.main.js',
            requests: [
              {
                path: '@remoteModules/utils/sharedComponents/elements/layout/main/footer/footer.main.scss'
              }
            ]
          },
          {
            path: '@remoteModules/utils/sharedComponents/elements/layout/main/nav/left/nav.main.js',
            requests: [
              {
                path: '@remoteModules/utils/sharedComponents/elements/layout/main/nav/left/nav.main.scss'
              },
              {
                path: '@remoteModules/utils/sharedComponents/dynamicViews/html/DynamicHtmlView.js'
              }
            ]
          }
        ]
      }
    ],
    children: [
      {
        path: '',
        requests: [
          {
            path: '@remoteModules/utils/sharedComponents/dynamicViews/router/ProxyRouterView.js',
            requests: [
              {
                path: '@remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
              }
            ]
          }
        ],
        children: [
          {
            path: '',
            useRouter: true,
            useStore: true,
            requests: [
              {
                path: '@remoteModules/frontend/modules/home/pages/page.Home.js',
                requests: [
                  {
                    path: '@remoteModules/utils/sharedComponents/dynamicViews/html/DynamicHtmlView.js'
                  },
                  {
                    path: '@remoteModules/utils/sharedComponents/elements/form/element.form.input.js'
                  },
                  {
                    path: '@remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
                  },
                  {
                    path: '@remoteModules/utils/sharedComponents/dynamicViews/template/TemplateListView.js'
                  },
                  {
                    path: '@remoteModules/frontend/modules/home/pages/page.Home.scss'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]);
