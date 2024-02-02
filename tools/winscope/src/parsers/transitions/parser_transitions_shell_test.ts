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
import {ElapsedTimestamp, RealTimestamp, TimestampType} from 'common/time';
import {UnitTestUtils} from 'test/unit/utils';
import {Parser} from 'trace/parser';
import {TraceType} from 'trace/trace_type';
import {PropertyTreeNode} from 'trace/tree_node/property_tree_node';

describe('ShellFileParserTransitions', () => {
  let parser: Parser<PropertyTreeNode>;

  beforeAll(async () => {
    parser = (await UnitTestUtils.getParser(
      'traces/elapsed_and_real_timestamp/shell_transition_trace.pb'
    )) as Parser<PropertyTreeNode>;
  });

  it('has expected trace type', () => {
    expect(parser.getTraceType()).toEqual(TraceType.SHELL_TRANSITION);
  });

  it('provides elapsed timestamps', () => {
    const timestamps = assertDefined(parser.getTimestamps(TimestampType.ELAPSED));
    const expected = [
      new ElapsedTimestamp(57649649922341n),
      new ElapsedTimestamp(0n),
      new ElapsedTimestamp(0n),
      new ElapsedTimestamp(57651299086892n),
      new ElapsedTimestamp(0n),
      new ElapsedTimestamp(0n),
    ];
    expect(timestamps).toEqual(expected);
  });

  it('provides real timestamps', () => {
    const timestamps = assertDefined(parser.getTimestamps(TimestampType.REAL));
    const expected = [
      new RealTimestamp(1683188477607285317n),
      new RealTimestamp(1683130827957362976n),
      new RealTimestamp(1683130827957362976n),
      new RealTimestamp(1683188479256449868n),
      new RealTimestamp(1683130827957362976n),
      new RealTimestamp(1683130827957362976n),
    ];
    expect(timestamps).toEqual(expected);
  });
});
