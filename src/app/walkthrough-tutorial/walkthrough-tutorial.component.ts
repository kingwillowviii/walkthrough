import {
  Component,
  EventEmitter,
  Output,
  Input,
  ElementRef,
  HostListener,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  ViewChild,
  Inject
} from '@angular/core';
import { DomSanitizer, DOCUMENT } from '@angular/platform-browser';

@Component({
  selector: 'walkthrough-tutorial',
  templateUrl: './walkthrough-tutorial.component.html',
  styleUrls: ['./walkthrough-tutorial.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom
})
export class WalkthroughTutorialComponent {

  // Immutable object, only modify with setState
  state = {
    id: '_' + Math.random().toString(36).substr(2, 9),
    active: false,
    index: -1,
    configuration: {
      intro: {
        startButtonText: "Lets start!",
        cancelButtonText: "Maybe later"
      },
      steps: []
    }
  };
  currentStep: any = {};
  selectorPositionStyle: string = "";
  stepPositionStyle: string = "";

  scrollOffset: number = 0;

  @ViewChild('selectorPositionCss') selectorPositionCss:ElementRef;
  @ViewChild('stepPositionCss') stepPositionCss:ElementRef;
  @ViewChild('step') step:ElementRef;

  // Outputs
  @Output() hasChanged = new EventEmitter();
  @Output() isActive = new EventEmitter();

  // Inputs
  @Input()
  set id(id: string) {
    this.setState('id', id);
  } 
  get id() {
    return this.state.id;
  }   
  @Input()
  set configuration(config: any) {
    let v = config;
    if (typeof config == "string") {
      try {
        v = JSON.parse(config);
      } catch(err) {
        console.log('err', err);
        v = {};
      }
    }
    if (v.intro.content)
      v.intro.content = this.sanitizer.bypassSecurityTrustHtml(this.gutterise(v.intro.content));
    if (v.steps.length > 0) {
      v.steps.forEach(step => {
        if (step.content)
          step.content = this.sanitizer.bypassSecurityTrustHtml(this.gutterise(step.content));
      });
    }
    this.setState('configuration', v);
  }
  get configuration() {
    return this.state['configuration'];
  }

  @Input()
  public activate = () => {
    this.setStates({'active': true });
    this.customEmit('isActive', 'is-active', this.state.active);
  }  
  @Input()
  public deactivate = () => {
    this.setStates({'active': false });
    this.customEmit('isActive', 'is-active', this.state.active);
  } 
  @Input()
  public reset = () => {
    this.resetIndex();
  } 

  // Listeners
  @HostListener('window:resize', ['$event'])
  onresize(event: any) {
    if (this.state.index >= 0) {
      this.positionStep(this.state.configuration.steps[this.state.index]);
    }
  }
  @HostListener("window:scroll", [])
  onWindowScroll() {
    let scroll = this.document.documentElement.scrollTop || this.document.body.scrollTop || 0;
    this.scrollOffset = scroll;
  }
  @HostListener('document:keydown', ['$event']) onKeydownHandler(event: KeyboardEvent) {
    if (this.state.active) {
      switch (event.keyCode) {
        case 27:
          this.deactivate();
          break;
        case 37:
          if (this.state.index > 0)
            this.goToStep(this.state.index-1);  
          break;
        case 13:
          if (this.state.index == -1)
            this.goToStep(0);  
          break;        
        case 39:
          this.state.index++;
          if (this.state.index >= 0 && (this.state.index < (this.state.configuration.steps.length)))
            this.goToStep(this.state.index);
          if (this.state.index >= 0 && (this.state.index == (this.state.configuration.steps.length)))
            this.finish();
          break;        
      }
    }
  }  
  
  // Public functions
  public goToStep(step: number) {
    this.setStates({'index': step });
    if (step >= 0 && step <= (this.state.configuration.steps.length-1)) {
      this.positionStep(this.state.configuration.steps[step]);
      this.setScollToElement(this.state.configuration.steps[step]);
    }
  }
  public finish() {
    this.deactivate();
    this.resetIndex();
  }

  constructor(private el: ElementRef, private cd: ChangeDetectorRef, private sanitizer: DomSanitizer, @Inject(DOCUMENT) private document: Document) {}

  private setState(key, value) {
    this.state = { ...this.state, [key]: value };
    this.customEmit('hasChanged', 'has-changed', this.state);
    this.cd.detectChanges();
  }
  private setStates(states: object) {
    this.state = Object.assign(this.state, states);
    this.customEmit('hasChanged', 'has-changed', this.state);
    this.cd.detectChanges();    
  }
  private gutterise(content: string) {
     if (!content.startsWith('<'))
      return '<span class="wt-t-gutter">' + content + '</span>';
    return content;
  }
  private positionStep(step: any) {
    this.getSelectorPosition(step);
    this.getStepPosition(step);
  }
  private getSelectorPosition(step: any) {
    let sel = document.querySelectorAll(step.selector)[0];
    if (step.selector && sel) {

      let bodyRect = document.body.getBoundingClientRect(),
      elemRect = sel.getBoundingClientRect();

      step.selectorPosition = { 
        'top': (elemRect.top - bodyRect.top), 
        'right': sel.getBoundingClientRect().right,
        'bottom': sel.getBoundingClientRect().height + (elemRect.top - bodyRect.top) + 7,
        'left': sel.getBoundingClientRect().left-7,
        'width': sel.getBoundingClientRect().width,
        'height': sel.getBoundingClientRect().height,
        'border-radius': 0,
        'padding': 5,
        'border-width': 2
      }
    } else {
      step.selectorPosition = { 
        'top': 0, 
        'right': 0,
        'bottom': 0,
        'left': 0,
        'width': 0,
        'height': 0,
        'border-radius': 0,
        'padding': 0,
        'border-width': 0
      }      
    }
    this.selectorPositionStyle = (`:host {
        --wt-t-overlay-top:` + (<number>(this.state.configuration.steps[this.state.index].selectorPosition.top)) + `px;
        --wt-t-overlay-left:` + (<number>(this.state.configuration.steps[this.state.index].selectorPosition.left)) + `px;  
        --wt-t-overlay-width:` + (<number>(this.state.configuration.steps[this.state.index].selectorPosition.width)) + `px;
        --wt-t-overlay-height:` + (<number>(this.state.configuration.steps[this.state.index].selectorPosition.height)) + `px;
        --wt-t-overlay-border-radius:` + (<number>(this.state.configuration.steps[this.state.index].selectorPosition['border-radius'])) + `%;
        --wt-t-overlay-border-width:` + (<number>(this.state.configuration.steps[this.state.index].selectorPosition['border-width'])) + `px;
        --wt-t-overlay-padding:` + (<number>(this.state.configuration.steps[this.state.index].selectorPosition.padding)) + `px;         
      }`);
    this.selectorPositionCss.nativeElement.innerHTML = `<style type="text/css">` + this.selectorPositionStyle + `</style>`;

  }
  private getStepPosition(step: any) {
    
    let b = document.body;
    let h = document.documentElement;
    let sel = document.querySelectorAll(step.selector)[0];
    let stepH = this.step.nativeElement.offsetHeight;
    let widW = window.innerWidth;
    let widH = Math.max( b.scrollHeight, b.offsetHeight, h.clientHeight, h.scrollHeight, h.offsetHeight );
    let stepAlignmentTop: Boolean = true;

    if (step.selector && sel) {
      
      stepAlignmentTop = (sel.getBoundingClientRect().bottom + stepH > widH) ? false : true;
      let t: Number = stepAlignmentTop ? this.state.configuration.steps[this.state.index].selectorPosition.bottom : this.state.configuration.steps[this.state.index].selectorPosition.top - stepH - 10;
      
      if (widW > 520) {

        let stepAlignmentLeft: Boolean = true;
        stepAlignmentLeft = ((widW - sel.getBoundingClientRect().left) > 600) ? true : false;
        let l: Number = stepAlignmentLeft ? sel.getBoundingClientRect().left - 25 : sel.getBoundingClientRect().right - 508;

        step.stepPosition = {
          'top': t,
          'left': l + 'px'
        }
      } else {
        step.stepPosition = {
          'top': t,
          'left': 0
        }
      }

    } else {

      if (widW > 520) {
        step.stepPosition = {
          'top': 0,
          'left': 'calc(100vw-500px)'
        }        
      } else {
        step.stepPosition = {
          'top': 0,
          'left': 0
        }
      }  
         
    }

    this.stepPositionStyle = (`:host {
      --wt-t-step-top:` + (<number>(this.state.configuration.steps[this.state.index].stepPosition.top)) + `px;
      --wt-t-step-left:` + (<number>(this.state.configuration.steps[this.state.index].stepPosition.left)) + `  
    }`); 

    this.stepPositionCss.nativeElement.innerHTML = `<style type="text/css">` + this.stepPositionStyle + `</style>`;
    this.state.configuration.steps[this.state.index].scrollPosition = (step.selector && sel) ? ((stepAlignmentTop) ? this.state.configuration.steps[this.state.index].selectorPosition.top - 10 : this.state.configuration.steps[this.state.index].stepPosition.top) : 0;
    
  }
  private setScollToElement(step: any) {
    window.scrollTo(0, step.scrollPosition);
  }
  private resetIndex() {
    this.setStates({'index': -1 });
  }

  // Custom Events
  private customEmit(output, event, val) {
    this[output].emit(val);
    const domEvent = new CustomEvent(event, { detail: val });
    this.el.nativeElement.dispatchEvent(domEvent);
  }

}
