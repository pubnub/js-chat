import { ComponentFixture, TestBed } from "@angular/core/testing"

import { TypingIndicatorComponentChat } from "./typing-indicator.component"

describe("TypingIndicatorComponent", () => {
  let component: TypingIndicatorComponentChat
  let fixture: ComponentFixture<TypingIndicatorComponentChat>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TypingIndicatorComponentChat],
    }).compileComponents()

    fixture = TestBed.createComponent(TypingIndicatorComponentChat)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it("should create", () => {
    expect(component).toBeTruthy()
  })
})
