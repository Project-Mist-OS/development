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

import {WinscopeEvent} from 'messaging/winscope_event';
import {EmitEvent} from 'messaging/winscope_event_emitter';
import {Trace} from 'trace/trace';
import {Traces} from 'trace/traces';
import {TraceType} from 'trace/trace_type';
import {HierarchyTreeNode} from 'trace/tree_node/hierarchy_tree_node';
import {NotifyHierarchyViewCallbackType} from 'viewers/common/abstract_hierarchy_viewer_presenter';
import {ViewerEvents} from 'viewers/common/viewer_events';
import {View, Viewer, ViewType} from 'viewers/viewer';
import {Presenter} from './presenter';
import {UiData} from './ui_data';

export class ViewerSurfaceFlinger implements Viewer {
  static readonly DEPENDENCIES: TraceType[] = [TraceType.SURFACE_FLINGER];

  private readonly trace: Trace<HierarchyTreeNode>;
  private readonly htmlElement: HTMLElement;
  private readonly presenter: Presenter;
  private readonly view: View;

  constructor(
    trace: Trace<HierarchyTreeNode>,
    traces: Traces,
    storage: Storage,
  ) {
    this.trace = trace;
    this.htmlElement = document.createElement('viewer-surface-flinger');

    const notifyViewCallback = (uiData: UiData) => {
      (this.htmlElement as any).inputData = uiData;
    };
    this.presenter = new Presenter(
      trace,
      traces,
      storage,
      notifyViewCallback as NotifyHierarchyViewCallbackType,
    );
    this.presenter.addEventListeners(this.htmlElement);

    this.htmlElement.addEventListener(
      ViewerEvents.RectsDblClick,
      async (event) => {
        const rectId = (event as CustomEvent).detail.clickedRectId;
        await this.presenter.onRectDoubleClick(rectId);
      },
    );

    this.view = new View(
      ViewType.TAB,
      this.getTraces(),
      this.htmlElement,
      'Surface Flinger',
    );
  }

  setEmitEvent(callback: EmitEvent) {
    this.presenter.setEmitEvent(callback);
  }

  async onWinscopeEvent(event: WinscopeEvent) {
    await this.presenter.onAppEvent(event);
  }

  getViews(): View[] {
    return [this.view];
  }

  getTraces(): Array<Trace<HierarchyTreeNode>> {
    return [this.trace];
  }
}
