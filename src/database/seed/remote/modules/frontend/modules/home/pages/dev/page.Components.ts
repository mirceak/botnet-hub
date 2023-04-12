import type {
  IHTMLElementComponent,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject({
    ['button-component']: () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/form/element.form.button.js'
      ),
    ['input-component']: () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/form/inputs/element.form.input.js'
      )
  });

  const scopedCss = mainScope.asyncStaticFile(
    () =>
      import(
        '/remoteModules/frontend/modules/home/pages/dev/page.Components.scss'
      )
  );

  class Element
    extends mainScope.BaseHtmlElement
    implements IHTMLElementComponent
  {
    initElement = this.useInitElement(mainScope, () => {
      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          o('<div>', { className: 'card gap-8 m-t-64 fit-content' }, [
            o('<div>', { className: 'header row items-center' }, [
              o('<button-component>', {
                elementAttributes: {
                  innerText: 'Back',
                  handlers: {
                    click: [
                      {
                        callback: async (e) => {
                          e.preventDefault();
                          mainScope.router.push({
                            path: 'home'
                          });
                        }
                      }
                    ]
                  }
                },
                attributes: {
                  className: 'bg-primary m-r-16'
                }
              }),
              o('<h1>', { innerText: 'Components' })
            ]),
            o('<div>', { className: 'card' }, [
              o('<div>', { className: 'm-b-16' }, [
                o('<h1>', { innerText: 'Buttons' })
              ]),
              o('<div>', { className: 'row gap-8' }, [
                o('<button-component>', {
                  elementAttributes: { innerText: 'Default' }
                }),
                o('<button-component>', {
                  elementAttributes: {
                    innerText: 'Primary'
                  },
                  attributes: {
                    className: 'bg-primary'
                  }
                }),
                o('<button-component>', {
                  elementAttributes: {
                    innerText: 'Secondary'
                  },
                  attributes: {
                    className: 'bg-secondary'
                  }
                }),
                o('<button-component>', {
                  elementAttributes: {
                    innerText: 'Info'
                  },
                  attributes: {
                    className: 'bg-info'
                  }
                }),
                o('<button-component>', {
                  elementAttributes: {
                    innerText: 'Warning'
                  },
                  attributes: {
                    className: 'bg-warning'
                  }
                }),
                o('<button-component>', {
                  elementAttributes: {
                    innerText: 'Danger'
                  },
                  attributes: {
                    className: 'bg-danger'
                  }
                })
              ])
            ]),
            o('<div>', { className: 'card' }, [
              o('<div>', { className: 'm-b-16' }, [
                o('<h1>', { innerText: 'Inputs' })
              ]),
              o('<div>', { className: 'row gap-8' }, [
                o('<div>', { className: 'row gap-8' }, [
                  o('<input-component>', {
                    elementAttributes: {
                      placeholder: 'Default'
                    }
                  }),
                  o('<input-component>', {
                    elementAttributes: {
                      placeholder: 'Primary'
                    },
                    attributes: {
                      className: 'bg-primary'
                    }
                  }),
                  o('<input-component>', {
                    elementAttributes: {
                      placeholder: 'Secondary'
                    },
                    attributes: {
                      className: 'bg-secondary'
                    }
                  }),
                  o('<input-component>', {
                    elementAttributes: {
                      placeholder: 'Info'
                    },
                    attributes: {
                      className: 'bg-info'
                    }
                  }),
                  o('<input-component>', {
                    elementAttributes: {
                      placeholder: 'Warning'
                    },
                    attributes: {
                      className: 'bg-warning'
                    }
                  }),
                  o('<input-component>', {
                    elementAttributes: {
                      placeholder: 'Danger'
                    },
                    attributes: {
                      className: 'bg-danger'
                    }
                  })
                ])
              ])
            ])
          ]),
          async () => {
            return instance.getScopedCss(await scopedCss);
          }
        ]
      });
    });
  }

  const instance = new mainScope.BaseComponent(
    tagName || 'components-component',
    Element
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
