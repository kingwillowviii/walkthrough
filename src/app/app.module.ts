import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injector,  } from '@angular/core';
import { createCustomElement } from '@angular/elements';

import { WalkthroughTutorialComponent } from './walkthrough-tutorial/walkthrough-tutorial.component';

@NgModule({
  declarations: [WalkthroughTutorialComponent],
  imports: [
    BrowserModule
  ],
  entryComponents: [WalkthroughTutorialComponent]
})
export class AppModule {
  constructor(private injector: Injector) {}

  ngDoBootstrap() {

    const elements: any[] = [
      [WalkthroughTutorialComponent, 'walkthrough-tutorial']
    ];

    for (const [component, name] of elements) {
      const el = createCustomElement(component, { injector: this.injector });
      customElements.define(name, el);
    }
  }
}
