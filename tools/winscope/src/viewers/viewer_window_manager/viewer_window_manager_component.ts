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
import {Component, Input} from '@angular/core';
import {PersistentStore} from 'common/persistent_store';
import {TraceType} from 'trace/trace_type';
import {CollapsibleSections} from 'viewers/common/collapsible_sections';
import {CollapsibleSectionType} from 'viewers/common/collapsible_section_type';
import {ShadingMode} from 'viewers/components/rects/types3d';
import {viewerCardStyle} from 'viewers/components/styles/viewer_card.styles';
import {UiData} from './ui_data';

@Component({
  selector: 'viewer-window-manager',
  template: `
    <div class="card-grid">
      <collapsed-sections
        [class.empty]="sections.areAllSectionsExpanded()"
        [sections]="sections"
        (sectionChange)="sections.onCollapseStateChange($event, false)">
      </collapsed-sections>
      <rects-view
        class="rects-view"
        [title]="rectsTitle"
        [store]="store"
        [rects]="inputData?.rects ?? []"
        [displays]="inputData?.displays ?? []"
        [highlightedItem]="inputData?.highlightedItem ?? ''"
        [shadingModes]="shadingModes"
        (collapseButtonClicked)="sections.onCollapseStateChange(CollapsibleSectionType.RECTS, true)"
        [class.collapsed]="sections.isSectionCollapsed(CollapsibleSectionType.RECTS)"></rects-view>
      <hierarchy-view
        class="hierarchy-view"
        [tree]="inputData?.tree"
        [dependencies]="inputData?.dependencies ?? []"
        [highlightedItem]="inputData?.highlightedItem ?? ''"
        [pinnedItems]="inputData?.pinnedItems ?? []"
        [store]="store"
        [userOptions]="inputData?.hierarchyUserOptions ?? {}"
        (collapseButtonClicked)="sections.onCollapseStateChange(CollapsibleSectionType.HIERARCHY, true)"
        [class.collapsed]="sections.isSectionCollapsed(CollapsibleSectionType.HIERARCHY)"></hierarchy-view>
      <properties-view
        class="properties-view"
        [userOptions]="inputData?.propertiesUserOptions ?? {}"
        [propertiesTree]="inputData?.propertiesTree"
        [traceType]="${TraceType.WINDOW_MANAGER}"
        [highlightedProperty]="inputData?.highlightedProperty ?? ''"
        [store]="store"
        [isProtoDump]="false"
        placeholderText="No selected item."
        (collapseButtonClicked)="sections.onCollapseStateChange(CollapsibleSectionType.PROPERTIES, true)"
        [class.collapsed]="sections.isSectionCollapsed(CollapsibleSectionType.PROPERTIES)"></properties-view>
    </div>
  `,
  styles: [viewerCardStyle],
})
export class ViewerWindowManagerComponent {
  @Input() inputData: UiData | undefined;
  @Input() store: PersistentStore | undefined;
  @Input() active = false;
  TraceType = TraceType;
  CollapsibleSectionType = CollapsibleSectionType;

  rectsTitle = 'WINDOWS';
  sections = new CollapsibleSections([
    {
      type: CollapsibleSectionType.RECTS,
      label: this.rectsTitle,
      isCollapsed: false,
    },
    {
      type: CollapsibleSectionType.HIERARCHY,
      label: CollapsibleSectionType.HIERARCHY,
      isCollapsed: false,
    },
    {
      type: CollapsibleSectionType.PROPERTIES,
      label: CollapsibleSectionType.PROPERTIES,
      isCollapsed: false,
    },
  ]);
  shadingModes = [
    ShadingMode.GRADIENT,
    ShadingMode.OPACITY,
    ShadingMode.WIRE_FRAME,
  ];
}
