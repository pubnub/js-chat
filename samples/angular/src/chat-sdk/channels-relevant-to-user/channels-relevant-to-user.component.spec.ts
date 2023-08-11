import { ComponentFixture, TestBed } from "@angular/core/testing"

import { ChannelsRelevantToUserComponent } from "./channels-relevant-to-user.component"

describe("ChannelsRelevantToUserComponent", () => {
  let component: ChannelsRelevantToUserComponent
  let fixture: ComponentFixture<ChannelsRelevantToUserComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChannelsRelevantToUserComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(ChannelsRelevantToUserComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it("should create", () => {
    expect(component).toBeTruthy()
  })
})
