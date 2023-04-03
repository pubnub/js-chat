import { ComponentFixture, TestBed } from "@angular/core/testing"

import { TypingIndicatorComponent } from "./typing-indicator.component"

describe("TypingIndicatorComponent", () => {
  let component: TypingIndicatorComponent
  let fixture: ComponentFixture<TypingIndicatorComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TypingIndicatorComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(TypingIndicatorComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it("should create", () => {
    expect(component).toBeTruthy()
  })
})
