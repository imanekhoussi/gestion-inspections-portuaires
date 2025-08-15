import { ComponentFixture, TestBed } from '@angular/core/testing';

// ✅ FIX: Changed import to the correct class name 'InspectionsCalendarComponent'
import { InspectionsCalendarComponent } from './inspections-calendar';

describe('InspectionsCalendar', () => {
  // ✅ FIX: Changed type to 'InspectionsCalendarComponent'
  let component: InspectionsCalendarComponent;
  let fixture: ComponentFixture<InspectionsCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // ✅ FIX: Changed imported component to 'InspectionsCalendarComponent'
      imports: [InspectionsCalendarComponent]
    })
    .compileComponents();

    // ✅ FIX: Changed component being created to 'InspectionsCalendarComponent'
    fixture = TestBed.createComponent(InspectionsCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});