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
import Activity from "common/trace/flickerlib/windows/Activity";
import Layer from "common/trace/flickerlib/layers/Layer";
import {LayerTraceEntry} from "common/trace/flickerlib/layers/LayerTraceEntry";
import {WindowContainer} from "common/trace/flickerlib/common";
import {WindowManagerState} from "common/trace/flickerlib/windows/WindowManagerState";
import WindowState from "common/trace/flickerlib/windows/WindowState";
import {TreeUtils, FilterType} from "common/utils/tree_utils";

class ProcessedWindowManagerState {
  constructor(
    public name: string,
    public stableId: string,
    public focusedApp: string,
    public focusedWindow: WindowState,
    public focusedActivity: Activity,
    public isInputMethodWindowVisible: boolean,
    public protoImeControlTarget: any,
    public protoImeInputTarget: any,
    public protoImeLayeringTarget: any,
    public protoImeInsetsSourceProvider: any,
    public proto: any
  ) {}
}

class ImeLayers {
  constructor(
    public name: string,
    public imeContainer: Layer,
    public inputMethodSurface: Layer,
    public focusedWindow: Layer|undefined,
    public taskOfImeContainer: Layer|undefined,
    public taskOfImeSnapshot: Layer|undefined
  ) {
  }
}

class ImeUtils {
  public static processWindowManagerTraceEntry(entry: WindowManagerState): ProcessedWindowManagerState {
    const displayContent = entry.root.children[0];

    return new ProcessedWindowManagerState(
      entry.name,
      entry.stableId,
      entry.focusedApp,
      entry.focusedWindow,
      entry.focusedActivity,
      this.isInputMethodVisible(displayContent),
      this.getImeControlTargetProperty(displayContent.proto),
      this.getImeInputTargetProperty(displayContent.proto),
      this.getImeLayeringTargetProperty(displayContent.proto),
      displayContent.proto.imeInsetsSourceProvider,
      entry.proto,
    );
  }

  public static getImeLayers(
    entry: LayerTraceEntry,
    processedWindowManagerState: ProcessedWindowManagerState): ImeLayers|undefined {
    const isImeContainer = TreeUtils.makeNodeFilter("ImeContainer");
    const imeContainer = TreeUtils.findDescendantNode(entry, isImeContainer);
    if (!imeContainer) {
      return undefined;
    }

    const isInputMethodSurface = TreeUtils.makeNodeFilter("InputMethod");
    const inputMethodSurface =
      TreeUtils.findDescendantNode(imeContainer, isInputMethodSurface);

    let focusedWindowLayer: Layer = undefined;
    const focusedWindowToken = processedWindowManagerState.focusedWindow?.token;
    if (focusedWindowToken) {
      const isFocusedWindow = TreeUtils.makeNodeFilter(focusedWindowToken);
      focusedWindowLayer = TreeUtils.findDescendantNode(entry, isFocusedWindow);
    }

    // we want to see both ImeContainer and IME-snapshot if there are
    // cases where both exist
    const taskLayerOfImeContainer =
      this.findAncestorTaskLayerOfImeLayer(entry, TreeUtils.makeNodeFilter("ImeContainer"));

    const taskLayerOfImeSnapshot =
      this.findAncestorTaskLayerOfImeLayer(entry, TreeUtils.makeNodeFilter("IME-snapshot"));

    return new ImeLayers(
      entry.name,
      imeContainer,
      inputMethodSurface,
      focusedWindowLayer,
      taskLayerOfImeContainer,
      taskLayerOfImeSnapshot
    );
  }

  public static transformInputConnectionCall(entry: any) {
    const obj = Object.assign({}, entry);
    if (obj.inputConnectionCall) {
      Object.getOwnPropertyNames(obj.inputConnectionCall).forEach(name => {
        const value = Object.getOwnPropertyDescriptor(obj.inputConnectionCall, name);
        if (!value?.value) delete obj.inputConnectionCall[name];
      });
    }
    return obj;
  }

  private static findAncestorTaskLayerOfImeLayer(entry: LayerTraceEntry, isTargetImeLayer: FilterType): Layer {
    const imeLayer = TreeUtils.findDescendantNode(entry, isTargetImeLayer);
    if (!imeLayer) {
      return undefined;
    }

    const isTaskLayer = TreeUtils.makeNodeFilter("Task, ImePlaceholder");
    const taskLayer = <Layer>TreeUtils.findAncestorNode(imeLayer, isTaskLayer);
    if (!taskLayer) {
      return undefined;
    }

    taskLayer.kind = "SF subtree - " + taskLayer.id;
    return taskLayer;
  }

  private static getImeControlTargetProperty(displayContentProto: any): any {
    const POSSIBLE_NAMES = ["inputMethodControlTarget", "imeControlTarget"];
    return this.findAnyPropertyWithMatchingName(displayContentProto, POSSIBLE_NAMES);
  }

  private static getImeInputTargetProperty(displayContentProto: any): any {
    const POSSIBLE_NAMES = ["inputMethodInputTarget", "imeInputTarget"];
    return this.findAnyPropertyWithMatchingName(displayContentProto, POSSIBLE_NAMES);
  }

  private static getImeLayeringTargetProperty(displayContentProto: any): any {
    const POSSIBLE_NAMES = ["inputMethodTarget", "imeLayeringTarget"];
    return this.findAnyPropertyWithMatchingName(displayContentProto, POSSIBLE_NAMES);
  }

  private static findAnyPropertyWithMatchingName(object: any, possible_names: string[]): any {
    const key = Object.keys(object).find(key => possible_names.includes(key));
    return key ? object[key] : undefined;
  }

  private static isInputMethodVisible(displayContent: WindowContainer) : boolean {
    const isInputMethod = TreeUtils.makeNodeFilter("InputMethod");
    const inputMethodWindowOrLayer =
      <WindowContainer>TreeUtils.findDescendantNode(displayContent, isInputMethod);
    return inputMethodWindowOrLayer?.isVisible == true;
  }
}

export {ImeUtils, ProcessedWindowManagerState, ImeLayers};
