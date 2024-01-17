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

import {assertDefined} from 'common/assert_utils';
import {HierarchyTreeNode} from 'trace/tree_node/hierarchy_tree_node';
import {PropertyTreeNodeFactory} from 'trace/tree_node/property_tree_node_factory';

export class ZOrderPathsComputation {
  private propertyFactory = new PropertyTreeNodeFactory();
  private root: HierarchyTreeNode | undefined;

  setRoot(value: HierarchyTreeNode): ZOrderPathsComputation {
    this.root = value;
    return this;
  }

  execute(): HierarchyTreeNode {
    if (!this.root) {
      throw Error('root not set');
    }

    const updatedRoot = this.updateZOrderParents(this.root);
    updatedRoot.forEachNodeDfs((node) => {
      if (node.id === 'LayerTraceEntry root') return;
      const zOrderPath = this.getZOrderPath(node);
      node.addEagerProperty(
        this.propertyFactory.makeCalculatedProperty(`${node.id}`, 'zOrderPath', zOrderPath)
      );
    });
    return updatedRoot;
  }

  private updateZOrderParents(root: HierarchyTreeNode): HierarchyTreeNode {
    const layerIdToTreeNode = new Map<number, HierarchyTreeNode>();
    root.forEachNodeDfs((node) => {
      if (node.isRoot()) return;
      layerIdToTreeNode.set(assertDefined(node.getEagerPropertyByName('id')).getValue(), node);
    });

    root.forEachNodeDfs((node) => {
      const zOrderRelativeOf = root.getEagerPropertyByName('zOrderRelativeOf')?.getValue();
      if (zOrderRelativeOf && zOrderRelativeOf !== -1) {
        const zParent = layerIdToTreeNode.get(zOrderRelativeOf);
        if (!zParent) {
          node.addEagerProperty(
            this.propertyFactory.makeCalculatedProperty(node.id, 'isMissingZParent', true)
          );
          return;
        }
        node.setZParent(zParent);
      }
    });
    return root;
  }

  private getZOrderPath(node: HierarchyTreeNode | undefined): number[] {
    if (!node) return [];

    const zOrderPath = this.getZOrderPath(node.getZParent());
    const z = node.getEagerPropertyByName('z')?.getValue();
    if (z !== undefined) zOrderPath.push(z);
    return zOrderPath;
  }
}
