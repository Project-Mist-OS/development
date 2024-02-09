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

import {assertDefined} from 'common/assert_utils';
import {ElapsedTimestamp, RealTimestamp, Timestamp, TimestampType} from 'common/time';
import {AbstractParser} from 'parsers/abstract_parser';
import root from 'protos/transitions/udc/json';
import {com} from 'protos/transitions/udc/static';
import {TraceFile} from 'trace/trace_file';
import {TraceType} from 'trace/trace_type';
import {PropertyTreeNode} from 'trace/tree_node/property_tree_node';
import {ParserTransitionsUtils} from './parser_transitions_utils';

export class ParserTransitionsShell extends AbstractParser<PropertyTreeNode> {
  private static readonly WmShellTransitionsTraceProto = root.lookupType(
    'com.android.wm.shell.WmShellTransitionTraceProto'
  );

  private realToElapsedTimeOffsetNs: undefined | bigint;
  private handlerMapping: undefined | {[key: number]: string};

  constructor(trace: TraceFile) {
    super(trace);
  }

  override getTraceType(): TraceType {
    return TraceType.SHELL_TRANSITION;
  }

  override decodeTrace(traceBuffer: Uint8Array): com.android.wm.shell.ITransition[] {
    const decodedProto = ParserTransitionsShell.WmShellTransitionsTraceProto.decode(
      traceBuffer
    ) as unknown as com.android.wm.shell.IWmShellTransitionTraceProto;

    const timeOffset = BigInt(decodedProto.realToElapsedTimeOffsetNanos?.toString() ?? '0');
    this.realToElapsedTimeOffsetNs = timeOffset !== 0n ? timeOffset : undefined;

    this.handlerMapping = {};
    for (const mapping of decodedProto.handlerMappings ?? []) {
      this.handlerMapping[mapping.id] = mapping.name;
    }

    return decodedProto.transitions ?? [];
  }

  override processDecodedEntry(
    index: number,
    timestampType: TimestampType,
    entryProto: com.android.wm.shell.ITransition
  ): PropertyTreeNode {
    return this.makePropertiesTree(timestampType, entryProto);
  }

  override getTimestamp(
    type: TimestampType,
    entry: com.android.wm.shell.ITransition
  ): undefined | Timestamp {
    // for consistency with all transitions, elapsed nanos are defined as shell dispatch time else 0n
    const decodedEntry = this.processDecodedEntry(0, type, entry);
    const dispatchTimeLong = decodedEntry
      .getChildByName('shellData')
      ?.getChildByName('dispatchTimeNs')
      ?.getValue();
    const timestampNs = dispatchTimeLong ? BigInt(dispatchTimeLong.toString()) : 0n;
    if (type === TimestampType.ELAPSED) {
      return new ElapsedTimestamp(timestampNs);
    }
    if (type === TimestampType.REAL) {
      return new RealTimestamp(timestampNs + assertDefined(this.realToElapsedTimeOffsetNs));
    }
    throw Error('Timestamp type unsupported');
  }

  protected getMagicNumber(): number[] | undefined {
    return [0x09, 0x57, 0x4d, 0x53, 0x54, 0x52, 0x41, 0x43, 0x45]; // .WMSTRACE
  }

  private validateShellTransitionEntry(entry: com.android.wm.shell.ITransition) {
    if (entry.id === 0) {
      throw new Error('Proto needs a non-null id');
    }
    if (
      !entry.dispatchTimeNs &&
      !entry.mergeRequestTimeNs &&
      !entry.mergeTimeNs &&
      !entry.abortTimeNs
    ) {
      throw new Error('Requires at least one non-null timestamp');
    }
    if (this.realToElapsedTimeOffsetNs === undefined) {
      throw new Error('missing realToElapsedTimeOffsetNs');
    }
    if (this.handlerMapping === undefined) {
      throw new Error('Missing handler mapping');
    }
  }

  private makePropertiesTree(
    timestampType: TimestampType,
    entryProto: com.android.wm.shell.ITransition
  ): PropertyTreeNode {
    this.validateShellTransitionEntry(entryProto);

    const shellEntryTree = ParserTransitionsUtils.makeShellPropertiesTree({
      entry: entryProto,
      realToElapsedTimeOffsetNs: this.realToElapsedTimeOffsetNs,
      timestampType,
      handlerMapping: this.handlerMapping,
    });
    const wmEntryTree = ParserTransitionsUtils.makeWmPropertiesTree();

    return ParserTransitionsUtils.makeTransitionPropertiesTree(shellEntryTree, wmEntryTree);
  }
}
