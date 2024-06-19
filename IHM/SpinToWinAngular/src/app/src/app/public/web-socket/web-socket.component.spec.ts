import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebSocketComponent } from './web-socket.component';

describe('WebSocketComponent', () => {
  let component: WebSocketComponent;
  let fixture: ComponentFixture<WebSocketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebSocketComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WebSocketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
