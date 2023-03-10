import type {
  IHTMLElementComponent,
  IHTMLElementsScope
} from '@remoteModules/frontend/engine/components/Main.js';

const getComponents = (mainScope: IHTMLElementsScope) => ({
  _DynamicHtmlView: mainScope.asyncRegisterComponent(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/dynamicViews/html/DynamicHtmlView.js'
      )
  ),
  _Input: mainScope.asyncRegisterComponent(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/elements/form/element.form.input.js'
      )
  ),
  _Button: mainScope.asyncRegisterComponent(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
      )
  ),
  _TemplateList: mainScope.asyncRegisterComponent(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/dynamicViews/template/TemplateListView.js'
      )
  )
});

const getClass = (
  mainScope: IHTMLElementsScope,
  instance: ReturnType<typeof getSingleton>
) => {
  const { _DynamicHtmlView, _Input, _Button, _TemplateList } =
    instance.registerComponents();

  return class Component
    extends mainScope.HTMLElement
    implements IHTMLElementComponent
  {
    constructor() {
      super();
    }

    init() {
      void mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          _Input.then(({ useComponent }) =>
            useComponent({
              onInput: (value: string) =>
                (mainScope.store.data.home.nameInput = value),
              elementAttributes: {
                placeholder: 'Enter Your Name...'
              }
            })
          ),
          _Button.then(({ useComponent }) =>
            useComponent({
              onClick: () => void mainScope.router.push('about'),
              label: 'Go To About',
              elementAttributes: {
                class: 'bg-primary'
              }
            })
          ),
          _Button.then(({ useComponent }) =>
            useComponent({
              onClick: () => void mainScope.router.push('components'),
              label: 'Go To Components'
            })
          ),
          _TemplateList.then(({ useComponent }) =>
            useComponent({
              noWatcher: true,
              listGetter: () => [
                _DynamicHtmlView.then(({ useComponent }) =>
                  useComponent({
                    attributes: {
                      class: ''
                    },
                    noWatcher: true,
                    instant: true,
                    templateGetter: () => `
                      <small>Consider this scoped</small>
                      <input-component x-scope="xInputScope"></input-component>
                      <button-component x-scope="xButtonScope"></button-component>
                      <template-list-view-component x-scope="xListViewScope"></template-list-view-component>
                    `,
                    scopesGetter: () => ({
                      xInputScope: _Input.then(({ useComponent }) =>
                        useComponent({
                          onInput: (value: string) =>
                            (mainScope.store.data.home.nameInput = value),
                          elementAttributes: {
                            placeholder: 'Test Input'
                          }
                        })
                      ),
                      xButtonScope: _Button.then(({ useComponent }) =>
                        useComponent({
                          label: 'Test Button'
                        })
                      ),
                      xListViewScope: _TemplateList.then(({ useComponent }) =>
                        useComponent({
                          noWatcher: true,
                          listGetter: () => [
                            _DynamicHtmlView.then(({ useComponent }) =>
                              useComponent({
                                templateGetter: () => `
                                  <small>Consider this nested and scoped</small>
                                  <input-component x-scope="xInputScope"></input-component>
                                  <button-component x-scope="xButtonScope"></button-component>
                                `,
                                noWatcher: true,
                                instant: true,
                                scopesGetter: () => ({
                                  xInputScope: _Input.then(({ useComponent }) =>
                                    useComponent({
                                      onInput: (value: string) =>
                                        (mainScope.store.data.home.nameInput =
                                          value),
                                      elementAttributes: {
                                        class: 'p-x-16',
                                        placeholder: 'Test Nested Input'
                                      }
                                    })
                                  ),
                                  xButtonScope: _Button.then(
                                    ({ useComponent }) =>
                                      useComponent({
                                        label: 'Test Nested Button'
                                      })
                                  )
                                })
                              })
                            )
                          ]
                        })
                      )
                    })
                  })
                )
              ]
            })
          ),
          _DynamicHtmlView.then(async ({ useComponent }) => {
            const scopedCss = await instance.useScopedCss();
            return useComponent({
              templateGetter() {
                return scopedCss;
              },
              noWatcher: true,
              instant: true
            });
          })
        ]
      });
    }
  };
};

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent {
    componentName = 'home-component';

    initComponent = (mainScope: IHTMLElementsScope) => {
      if (!window.customElements.get(this.componentName)) {
        this.registerComponent(this.componentName, getClass(mainScope, this));
      } else if (mainScope.SSR) {
        this.registerComponents();
      }
    };

    registerComponents = () => {
      return getComponents(mainScope);
    };

    useComponent = () => {
      return this.getComponentScope(this.componentName);
    };

    useScopedCss = async () => {
      const scopedCss = await mainScope.loadFile(
        () =>
          import('@remoteModules/frontend/modules/home/pages/page.Home.scss')
      );
      return this.getScopedCss(scopedCss);
    };
  }

  return new Instance();
};

let componentInstance: ReturnType<typeof getSingleton>;

export default (mainScope: IHTMLElementsScope) => {
  if (!componentInstance || window.SSR) {
    if (!componentInstance) {
      componentInstance = getSingleton(mainScope);
    }
    componentInstance.initComponent(mainScope);
  }
  return componentInstance;
};
