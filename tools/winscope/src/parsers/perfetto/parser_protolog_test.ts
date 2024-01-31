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
import {ElapsedTimestamp, RealTimestamp, TimestampType} from 'common/time';
import {UnitTestUtils} from 'test/unit/utils';
import {Parser} from 'trace/parser';
import {LogMessage} from 'trace/protolog';
import {TraceType} from 'trace/trace_type';

describe('Perfetto ParserProtolog', () => {
  let parser: Parser<object>;

  const expectedFirstLogMessageElapsed = {
    text: 'Sent Transition (#11) createdAt=01-29 17:54:23.793',
    time: '1h38m59s2ms349294ns',
    tag: 'WindowManager',
    level: 'VERBOSE',
    at: '<NO_LOC>',
    timestamp: 5939002349294n,
  };

  const expectedFirstLogMessageReal = {
    text: 'Sent Transition (#11) createdAt=01-29 17:54:23.793',
    time: '2024-01-29T16:54:24.827624563',
    tag: 'WindowManager',
    level: 'VERBOSE',
    at: '<NO_LOC>',
    timestamp: 1706547264827624563n,
  };

  beforeAll(async () => {
    parser = await UnitTestUtils.getPerfettoParser(
      TraceType.PROTO_LOG,
      'traces/perfetto/protolog.perfetto-trace'
    );
  });

  it('has expected trace type', () => {
    expect(parser.getTraceType()).toEqual(TraceType.PROTO_LOG);
  });

  it('provides elapsed timestamps', () => {
    const timestamps = assertDefined(parser.getTimestamps(TimestampType.ELAPSED));

    expect(timestamps.length).toEqual(75);

    // TODO: They shouldn't all have the same timestamp...
    const expected = [
      new ElapsedTimestamp(5939002349294n),
      new ElapsedTimestamp(5939002349294n),
      new ElapsedTimestamp(5939002349294n),
    ];
    expect(timestamps.slice(0, 3)).toEqual(expected);
  });

  it('provides real timestamps', () => {
    const timestamps = assertDefined(parser.getTimestamps(TimestampType.REAL));

    expect(timestamps.length).toEqual(75);

    // TODO: They shouldn't all have the same timestamp...
    const expected = [
      new RealTimestamp(1706547264827624563n),
      new RealTimestamp(1706547264827624563n),
      new RealTimestamp(1706547264827624563n),
    ];
    expect(timestamps.slice(0, 3)).toEqual(expected);
  });

  it('reconstructs human-readable log message (ELAPSED time)', async () => {
    const message = await parser.getEntry(0, TimestampType.ELAPSED);

    expect(Object.assign({}, message)).toEqual(expectedFirstLogMessageElapsed);
    expect(message).toBeInstanceOf(LogMessage);
  });

  it('reconstructs human-readable log message (REAL time)', async () => {
    const message = await parser.getEntry(0, TimestampType.REAL);

    expect(Object.assign({}, message)).toEqual(expectedFirstLogMessageReal);
    expect(message).toBeInstanceOf(LogMessage);
  });
});