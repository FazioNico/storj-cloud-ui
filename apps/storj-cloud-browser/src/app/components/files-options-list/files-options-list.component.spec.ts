import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilesOptionsListComponent } from './files-options-list.component';

describe('FilesOptionsListComponent', () => {
  let component: FilesOptionsListComponent;
  let fixture: ComponentFixture<FilesOptionsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilesOptionsListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilesOptionsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
