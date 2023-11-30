/*
 * Copyright (C) 2024 The Android Open Source Project
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

import {TraceRect} from 'trace/trace_rect';
import {PropertiesProvider} from 'trace/tree_node/properties_provider';
import {PropertyTreeNode} from './property_tree_node';
import {TreeNode} from './tree_node';

export class HierarchyTreeNode extends TreeNode {
  private rects: TraceRect[] | undefined;
  private zParent: this | undefined;

  constructor(id: string, name: string, protected readonly propertiesProvider: PropertiesProvider) {
    super(id, name);
  }

  async getAllProperties(): Promise<PropertyTreeNode> {
    return await this.propertiesProvider.getAll();
  }

  getEagerPropertyByName(name: string): PropertyTreeNode | undefined {
    return this.propertiesProvider.getEagerProperties().getChildById(`${this.id}.${name}`);
  }

  addEagerProperty(property: PropertyTreeNode): void {
    this.propertiesProvider.addEagerProperty(property);
  }

  setRects(value: TraceRect[]) {
    this.rects = value;
  }

  getRects(): TraceRect[] | undefined {
    return this.rects;
  }

  setZParent(parent: this): void {
    this.zParent = parent;
  }

  getZParent(): this | undefined {
    return this.zParent;
  }

  override isRoot(): boolean {
    return !this.zParent;
  }

  findAncestor(targetNodeFilter: (node: this) => boolean): this | undefined {
    let ancestor = this.getZParent();

    while (ancestor && !targetNodeFilter(ancestor)) {
      ancestor = ancestor.getZParent();
    }

    return ancestor;
  }
}
