/*
* Copyright (C) 2022 The Android Open Source Project
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

import {
  Component,
  Input,
  Inject,
  ViewEncapsulation,
  SimpleChanges,
  Output,
  EventEmitter,
  ViewChild,
  HostListener,
} from "@angular/core";
import { FormControl, FormGroup, Validators} from "@angular/forms";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { TraceType } from "common/trace/trace_type";
import { TRACE_INFO } from "app/trace_info";
import { TimelineCoordinator, TimestampChangeObserver } from "app/timeline_coordinator";
import { MiniTimelineComponent } from "./mini_timeline.component";
import { Timestamp } from "common/trace/timestamp";
import { TimeUtils } from "common/utils/time_utils";

const MAX_SELECTED_TRACES = 3;

@Component({
  selector: "timeline",
  encapsulation: ViewEncapsulation.None,
  template: `
    <div id="expanded-nav" *ngIf="expanded">
        <div id="video-content" *ngIf="videoUrl !== undefined">
          <video
            *ngIf="videoCurrentTime !== undefined"
            id="video"
            [currentTime]="videoCurrentTime"
            [src]="videoUrl">
          </video>
          <div *ngIf="videoCurrentTime === undefined" class="no-video-message">
            <p>No screenrecording frame to show</p>
            <p>Current timestamp before first screenrecording frame.</p>
          </div>
        </div>
        <expanded-timeline
          [currentTimestamp]="currentTimestamp"
          (onTimestampChanged)="updateCurrentTimestamp($event)"
          id="expanded-timeline"
        ></expanded-timeline>
    </div>
    <div class="navbar">
        <div id="time-selector">
          <!-- TODO: Disable button if there are no timestamps before -->
            <button mat-icon-button color="primary" (click)="moveToPreviousEntry()">
                <mat-icon>chevron_left</mat-icon>
            </button>
            <form [formGroup]="timestampForm" class="time-selector-form" (ngSubmit)="onTimestampFormSubmitted()">
                <mat-form-field class="time-input" appearance="fill" (change)="inputTimeChanged($event)">
                    <input matInput="number" formControlName="selectedTime">
                </mat-form-field>
                <mat-form-field class="time-input" appearance="fill" (change)="inputTimeChanged($event)">
                    <input matInput="number" formControlName="selectedNs">
                </mat-form-field>
            </form>
            <!-- TODO: Disable button if there are no timestamps after -->
            <button mat-icon-button color="primary" (click)="moveToNextEntry()">
                <mat-icon>chevron_right</mat-icon>
            </button>
        </div>
        <div id="trace-selector">
            <mat-form-field appearance="none">
                <mat-select #traceSelector [formControl]="selectedTracesFormControl" multiple (closed)="onTraceSelectionClosed()">
                  <div class="tip">
                    Select up to 2 additional traces to display.
                  </div>
                  <mat-option
                    *ngFor="let trace of availableTraces"
                    [value]="trace"
                    [style]="{
                      color: TRACE_INFO[trace].color,
                      opacity: isOptionDisabled(trace) ? 0.5 : 1.0
                    }"
                    [disabled]="isOptionDisabled(trace)"
                  >
                    <mat-icon>{{ TRACE_INFO[trace].icon }}</mat-icon>
                    {{ TRACE_INFO[trace].name }}
                  </mat-option>
                  <div class="actions">
                    <button mat-button color="primary" (click)="traceSelector.close()">Cancel</button>
                    <button mat-flat-button color="primary" (click)="applyNewTraceSelection(); traceSelector.close()">Apply</button>
                  </div>
                  <mat-select-trigger class="shown-selection">
                    <mat-icon
                      *ngFor="let selectedTrace of selectedTraces"
                      [style]="{color: TRACE_INFO[selectedTrace].color}"
                    >
                      {{ TRACE_INFO[selectedTrace].icon }}
                    </mat-icon>
                  </mat-select-trigger>
                </mat-select>
            </mat-form-field>
        </div>
        <mini-timeline
          [currentTimestamp]="currentTimestamp"
          [selectedTraces]="selectedTraces"
          (changeTimestamp)="updateCurrentTimestamp($event)"
          (changeSeekTimestamp)="updateSeekTimestamp($event)"
          id="mini-timeline"
          #miniTimeline
        ></mini-timeline>
        <div id="toggle">
            <button mat-icon-button color="primary" aria-label="Toogle Expanded Timeline" (click)="toggleExpand()">
                <mat-icon *ngIf="!_expanded">expand_less</mat-icon>
                <mat-icon *ngIf="_expanded">expand_more</mat-icon>
            </button>
        </div>
    </div>
`,
  styles: [`
    .navbar {
      display: flex;
      width: 100%;
      flex-direction: row;
      align-items: center;
      justify-content: center;
    }
    #expanded-nav {
      display: flex;
      border-bottom: 1px solid #3333
    }
    #time-selector {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
    }
    .time-selector-form {
      display: flex;
      flex-direction: column;
      width: 15em;
    }
    .time-selector-form .time-input {
      width: 100%;
      margin-bottom: -1.34375em;
      text-align: center;
    }
    #mini-timeline {
      flex-grow: 1;
      align-self: stretch;
    }
    #video-content {
      position: relative;
      min-width: 20rem;
      min-height: 35rem;
      align-self: stretch;
      text-align: center;
      border: 2px solid black;
      flex-basis: 0px;
      flex-grow: 1;
      display: flex;
      align-items: center;
    }
    #video {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 100%;
    }
    #expanded-nav {
      display: flex;
      flex-direction: row;
    }
    #expanded-timeline {
      flex-grow: 1;
    }
    #trace-selector .mat-form-field-infix {
      width: 50px;
      padding: 0 0.75rem 0 0.5rem;
      border-top: unset;
    }
    #trace-selector .mat-icon {
      padding: 2px;
    }
    #trace-selector .shown-selection {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: auto;
    }
    #trace-selector .mat-select-trigger {
      height: unset;
    }
    #trace-selector .mat-form-field-wrapper {
      padding: 0;
    }
    .mat-select-panel {
      max-height: unset!important;
      font-family: 'Roboto', sans-serif;
    }
    .tip {
      padding: 1.5rem;
      font-weight: 200;
      border-bottom: solid 1px #DADCE0;
    }
    .actions {
      border-top: solid 1px #DADCE0;
      width: 100%;
      padding: 1.5rem;
      float: right;
      display: flex;
      justify-content: flex-end;
    }
    .no-video-message {
      padding: 1rem;
      font-family: 'Roboto', sans-serif;
    }
  `],
})
export class TimelineComponent implements TimestampChangeObserver {
  @Input() expanded = false;
  @Input() activeTrace: TraceType = TraceType.SURFACE_FLINGER;
  @Input() availableTraces: TraceType[] = [];
  @Input() set videoData(value: Blob|undefined) {
    if (value !== undefined) {
      this.videoUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(value));
    } else {
      this.videoUrl = undefined;
    }
  }

  @Output() onCollapsedTimelineSizeChanged = new EventEmitter<number>();

  @ViewChild("miniTimeline") private miniTimelineComponent!: MiniTimelineComponent;

  selectedTraces: TraceType[] = [];
  selectedTracesFormControl = new FormControl();

  selectedTimeFormControl = new FormControl("", Validators.compose([
    Validators.required,
    Validators.pattern(TimeUtils.HUMAN_TIMESTAMP_REGEX)]));
  selectedNsFormControl = new FormControl(BigInt(0), Validators.compose([
    Validators.required,
    Validators.pattern(TimeUtils.NS_TIMESTAMP_REGEX)]));
  timestampForm = new FormGroup({
    selectedTime: this.selectedTimeFormControl,
    selectedNs: this.selectedNsFormControl,
  });

  videoUrl: SafeUrl|undefined;

  TRACE_INFO = TRACE_INFO;

  get hasVideo() {
    return this.timelineCoordinator.getTimelines().get(TraceType.SCREEN_RECORDING) !== undefined;
  }

  get videoCurrentTime() {
    return this.timelineCoordinator.timestampAsElapsedScreenrecordingSeconds(this.currentTimestamp);
  }

  private seekTimestamp: Timestamp|undefined;

  get currentTimestamp(): Timestamp {
    if (this.seekTimestamp !== undefined) {
      return this.seekTimestamp;
    }

    const timestamp = this.timelineCoordinator.currentTimestamp;
    if (timestamp === undefined) {
      throw Error("A timestamp should have been set by the time the timeline is loaded");
    }

    return timestamp;
  }

  constructor(
    @Inject(TimelineCoordinator) private timelineCoordinator: TimelineCoordinator,
    @Inject(DomSanitizer) private sanitizer: DomSanitizer
  ) {
    this.timelineCoordinator.registerObserver(this);
  }

  ngAfterViewInit() {
    const height = this.miniTimelineComponent.miniTimelineWraper.nativeElement.offsetHeight;
    this.onCollapsedTimelineSizeChanged.emit(height);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["activeTrace"] !== undefined) {
      if (this.selectedTraces.length < MAX_SELECTED_TRACES) {
        const newSelection = new Set(this.selectedTraces)
          .add(changes["activeTrace"].currentValue);
        this.selectedTraces = [...newSelection];
      } else {
        if (this.selectedTraces
          .find((trace: TraceType) => trace === changes["activeTrace"].currentValue)) {
          // Active trace already selected, no need to change anything
        } else {
          // At max length so remove current active trace
          const newSelection = new Set<TraceType>(this.selectedTraces);
          newSelection.delete(changes["activeTrace"].previousValue);
          newSelection.add(changes["activeTrace"].currentValue);
          this.selectedTraces = [...newSelection];
        }
      }

      this.selectedTracesFormControl.setValue(this.selectedTraces);
    }
  }

  onCurrentTimestampChanged(_: Timestamp): void {
    this.updateTimeInputValuesToCurrentTimestamp();
  }

  toggleExpand() {
    this.expanded = !this.expanded;
  }

  updateCurrentTimestamp(timestamp: Timestamp) {
    this.timelineCoordinator.updateCurrentTimestamp(timestamp);
  }

  updateSeekTimestamp(timestamp: Timestamp|undefined) {
    this.seekTimestamp = timestamp;
    this.updateTimeInputValuesToCurrentTimestamp();
  }

  private updateTimeInputValuesToCurrentTimestamp() {
    this.selectedTimeFormControl.setValue(TimeUtils.nanosecondsToHuman(this.currentTimestamp.getValueNs(), false));
    this.selectedNsFormControl.setValue(this.currentTimestamp.getValueNs());
  }

  isOptionDisabled(trace: TraceType) {
    if (this.activeTrace === trace) {
      return true;
    }

    // Reached limit of options and is not a selected element
    if ((this.selectedTracesFormControl.value?.length ?? 0) >= MAX_SELECTED_TRACES
      && this.selectedTracesFormControl.value?.find((el: TraceType) => el === trace) === undefined) {
      return true;
    }

    return false;
  }

  onTraceSelectionClosed() {
    this.selectedTracesFormControl.setValue(this.selectedTraces);
  }

  applyNewTraceSelection() {
    this.selectedTraces = this.selectedTracesFormControl.value;
  }

  @HostListener("document:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowLeft": {
        this.moveToPreviousEntry();
        break;
      }
      case "ArrowRight": {
        this.moveToNextEntry();
        break;
      }
    }
  }

  moveToPreviousEntry() {
    this.timelineCoordinator.moveToPreviousEntryFor(this.activeTrace);
  }

  moveToNextEntry() {
    this.timelineCoordinator.moveToNextEntryFor(this.activeTrace);
  }

  inputTimeChanged(event: Event) {
    console.error("Input time changed to", event);
    if (event.type !== "change") {
      return;
    }

    const target = event.target as HTMLInputElement;

    if (TimeUtils.NS_TIMESTAMP_REGEX.test(target.value)) {
      const timestamp = new Timestamp(this.timelineCoordinator.getTimestampType()!, BigInt(target.value));
      this.timelineCoordinator.updateCurrentTimestamp(timestamp);
    } else if (TimeUtils.HUMAN_TIMESTAMP_REGEX.test(target.value)) {
      const timestamp = new Timestamp(this.timelineCoordinator.getTimestampType()!,
        TimeUtils.humanToNanoseconds(target.value));
      this.timelineCoordinator.updateCurrentTimestamp(timestamp);
    } else {
      console.warn(`Invalid timestamp input provided "${target.value}" and can't be processed.`);
      return;
    }

    this.updateTimeInputValuesToCurrentTimestamp();
  }

  onTimestampFormSubmitted() {
    console.log("onTimestampFormSubmitted");
  }
}
