import type { IHTMLElementsScope } from '@remoteModules/frontend/engine/components/Main.js';

export const staticScope = {
  registered: false,
  componentName: 'home-component',
  scssIndex: 0,
  scss() {
    const style = `<style staticScope lang="sass">
home-component {
  input-component {
    input {
      padding: 6px 12px;
      font-size: 16px;
      font-weight: 400;
      line-height: 1.5;
      color: #212529;
      background-color: #fff;
      background-clip: padding-box;
      border: 1px solid #ced4da;
      appearance: none;
      border-radius: 4px;
      transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
    &:focus{
        color: #212529;
        background-color: #fff;
        border-color: #86b7fe;
        outline: 0;
        box-shadow: 0 0 0 0.25rem rgb(13 110 253 / 25%);
      }            
    }
  }
}
</style staticScope>
  `;
    return style.replace(
      '<style staticScope',
      `<style staticScope=${this.scssIndex++}`,
    );
  },
};

export const useComponent = () => {
  return {
    componentName: staticScope.componentName,
  };
};

const initComponent = (mainScope: IHTMLElementsScope) => {
  const [DynamicHtmlView, Input, Button] = [
    mainScope.asyncRegisterComponent(
      () =>
        import(
          '@remoteModules/utils/sharedComponents/dynamicViews/html/DynamicHtmlView.js'
        ),
    ),
    mainScope.asyncRegisterComponent(
      () =>
        import('@remoteModules/utils/sharedComponents/form/elements/Input.js'),
    ),
    mainScope.asyncRegisterComponent(
      () =>
        import(
          '@remoteModules/utils/sharedComponents/elements/button/Button.js'
        ),
    ),
  ];

  return class HomeComponent extends window.HTMLElement {
    constructor() {
      super();
    }

    async init() {
      await mainScope.asyncHydrationCallback(async () => {
        await mainScope.asyncLoadComponentTemplate({
          target: this,
          components: [
            Input.then(({ useComponent }) =>
              useComponent({
                onInput: (value: string) =>
                  (mainScope.store.data.home.nameInput = value),
                placeholder: 'Enter Your Name',
              }),
            ),
            Button.then(({ useComponent }) =>
              useComponent({
                onClick: () => mainScope.router.push('about'),
                label: 'Go To About',
              }),
            ),
            DynamicHtmlView.then(({ useComponent }) =>
              useComponent({
                contentGetter() {
                  return staticScope.scss();
                },
                noWatcher: true,
                instant: true,
              }),
            ),
          ],
        });
      });
    }
  };
};

export const registerComponent = async (mainScope: IHTMLElementsScope) => {
  if (staticScope.registered) {
    if (!mainScope.SSR) {
      return;
    } else {
      initComponent(mainScope);
    }
  }

  if (!staticScope.registered) {
    window.customElements.define(
      staticScope.componentName,
      initComponent(mainScope),
    );
  }

  staticScope.registered = true;
};
