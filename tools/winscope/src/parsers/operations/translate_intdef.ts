/*
 * Copyright (C) 2023 The Android Open Source Project
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

import {TamperedProtoField} from 'parsers/tampered_message_type';
import {Operation} from 'trace/tree_node/operations/operation';
import {PropertyTreeNode} from 'trace/tree_node/property_tree_node';

export class TranslateIntDef implements Operation<PropertyTreeNode> {
  constructor(
    private readonly rootField: TamperedProtoField,
    private readonly propertyAllowlist?: string[],
    private readonly propertyDenylist?: string[]
  ) {}

  apply(value: PropertyTreeNode): PropertyTreeNode {
    //TODO: implement operation
    return value;
  }
}
