import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const { builder: b } = mainScope.useComponents({
    ['button-component']: () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
      ),
    ['input-component']: () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/form/inputs/element.form.input.js'
      )
  });

  const scopedCss = mainScope.asyncStaticFile(
    () =>
      import(
        '/remoteModules/frontend/modules/home/pages/dev/page.Components.scss'
      )
  );

  class Element extends mainScope.HTMLElement {
    initElement = this.useInitElement(mainScope, () => {
      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          b('<div>', { className: 'card gap-8 m-a-16 fit-content' }, [
            b('<div>', { className: 'header row items-center' }, [
              b('<button-component>', {
                elementAttributes: {
                  innerText: 'Back'
                },
                attributes: {
                  className: 'bg-primary m-r-16'
                },
                onClick() {
                  mainScope.router.push({ name: 'home' });
                }
              }),
              b('<h1>', { innerText: 'Components' })
            ]),
            b('<div>', { className: 'card' }, [
              b('<div>', { className: 'm-b-16' }, [
                b('<h1>', { innerText: 'Buttons' })
              ]),
              b('<div>', { className: 'row gap-8' }, [
                b('<button-component>', {
                  elementAttributes: {
                    innerText: 'Default'
                  }
                }),
                b('<button-component>', {
                  elementAttributes: {
                    innerText: 'Primary'
                  },
                  attributes: {
                    className: 'bg-primary'
                  }
                }),
                b('<button-component>', {
                  elementAttributes: {
                    innerText: 'Secondary'
                  },
                  attributes: {
                    className: 'bg-secondary'
                  }
                }),
                b('<button-component>', {
                  elementAttributes: {
                    innerText: 'Info'
                  },
                  attributes: {
                    className: 'bg-info'
                  }
                }),
                b('<button-component>', {
                  elementAttributes: {
                    innerText: 'Warning'
                  },
                  attributes: {
                    className: 'bg-warning'
                  }
                }),
                b('<button-component>', {
                  elementAttributes: {
                    innerText: 'Danger'
                  },
                  attributes: {
                    className: 'bg-danger'
                  }
                })
              ])
            ]),
            b('<div>', { className: 'card' }, [
              b('<div>', { className: 'm-b-16' }, [
                b('<h1>', { innerText: 'Inputs' })
              ]),
              b('<div>', { className: 'row gap-8' }, [
                b('<div>', { className: 'row gap-8' }, [
                  b('<input-component>', {
                    elementAttributes: {
                      placeholder: 'Default'
                    }
                  }),
                  b('<input-component>', {
                    elementAttributes: {
                      placeholder: 'Primary'
                    },
                    attributes: {
                      className: 'bg-primary'
                    }
                  }),
                  b('<input-component>', {
                    elementAttributes: {
                      placeholder: 'Secondary'
                    },
                    attributes: {
                      className: 'bg-secondary'
                    }
                  }),
                  b('<input-component>', {
                    elementAttributes: {
                      placeholder: 'Info'
                    },
                    attributes: {
                      className: 'bg-info'
                    }
                  }),
                  b('<input-component>', {
                    elementAttributes: {
                      placeholder: 'Warning'
                    },
                    attributes: {
                      className: 'bg-warning'
                    }
                  }),
                  b('<input-component>', {
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

  const instance = new mainScope.HTMLComponent(
    tagName || 'components-component',
    Element
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
