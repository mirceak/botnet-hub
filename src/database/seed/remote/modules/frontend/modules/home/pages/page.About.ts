import type { IHTMLElementsScope } from '@remoteModules/frontend/engine/components/Main.js';

export const staticScope = {
  registered: false,
  componentName: 'about-component',
  scssIndex: 0,
  scss() {
    const style = `<style staticScope lang="sass">
about-component {
  button-component {
    button {            
      cursor: pointer;
      outline: 0;
      display: inline-block;
      font-weight: 400;
      line-height: 1.5;
      text-align: center;
      background-color: transparent;
      padding: 6px 12px;
      font-size: 1rem;
      border-radius: .25rem;
      transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
      color: #0d6efd;
      border: 1px solid #0d6efd;
     &:hover {
          color: #fff;
          background-color: #0d6efd;
          border-color: #0d6efd;
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
  const [DynamicHtmlView, Button] = [
    mainScope.asyncRegisterComponent(
      () =>
        import(
          '@remoteModules/utils/sharedComponents/dynamicViews/html/DynamicHtmlView.js'
        ),
    ),
    mainScope.asyncRegisterComponent(
      () =>
        import(
          '@remoteModules/utils/sharedComponents/elements/button/Button.js'
        ),
    ),
  ];

  return class AboutComponent extends window.HTMLElement {
    constructor() {
      super();
    }

    async init() {
      await mainScope.asyncHydrationCallback(async () => {
        await mainScope.asyncLoadComponentTemplate({
          target: this,
          components: [
            DynamicHtmlView.then(({ useComponent }) =>
              useComponent?.({
                contentGetter() {
                  return `
                    <h1>About Page</h1>
                  `;
                },
              }),
            ),
            Button.then(({ useComponent }) =>
              useComponent({
                onClick: () => mainScope.router.push('home'),
                label: 'Go To Home',
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

console.log(window.HTMLElement);

interface IComponent {
  initComponent: (mainScope: IHTMLElementsScope) => void;
  useComponent: <T>(scope?: T) => unknown;
  registered: boolean;
  componentName: string;
}

abstract class AComponent implements Partial<IComponent> {
  registered = false;
  staticScope = {};
}

class AboutComponent extends AComponent implements IComponent {
  componentName = 'about-component';

  initComponent(mainScope: IHTMLElementsScope): void {
    if (!this.registered) {
      window.customElements.define(
        staticScope.componentName,
        initComponent(mainScope),
      );
      this.registered = true;
    }
  }

  useComponent() {
    return {
      componentName: staticScope.componentName,
    };
  }
}

let instance: InstanceType<typeof AboutComponent>;
export default (mainScope: IHTMLElementsScope) => {
  if (!instance || window.SSR) {
    if (!instance) {
      instance = new AboutComponent();
    }
    instance.initComponent(mainScope);
  }
  return instance;
};

export const registerComponent = async (mainScope: IHTMLElementsScope) => {
  if (staticScope.registered) {
    if (!mainScope.SSR) {
      return;
    } else {
      staticScope.scssIndex = 0;
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
