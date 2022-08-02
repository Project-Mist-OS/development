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
import {Timestamp, TimestampType} from "common/trace/timestamp";
import {TraceType} from "common/trace/trace_type";
import {ParserFactory} from "./parser_factory";
import {Parser} from "./parser";
import {UnitTestUtils} from "test/unit/utils";

describe("ParserInputMethodService", () => {
  let parser: Parser;

  beforeAll(async () => {
    const buffer = UnitTestUtils.getFixtureBlob("trace_InputMethodService.pb");
    const parsers = await new ParserFactory().createParsers([buffer]);
    expect(parsers.length).toEqual(1);
    parser = parsers[0];
  });

  it("has expected trace type", () => {
    expect(parser.getTraceType()).toEqual(TraceType.INPUT_METHOD_SERVICE);
  });

  it("provides timestamps", () => {
    const expected = [
      new Timestamp(TimestampType.ELAPSED, 1149230019887n),
      new Timestamp(TimestampType.ELAPSED, 1149234359324n),
      new Timestamp(TimestampType.ELAPSED, 1149241227244n),
      new Timestamp(TimestampType.ELAPSED, 1149243083608n),
      new Timestamp(TimestampType.ELAPSED, 1149249518016n),
      new Timestamp(TimestampType.ELAPSED, 1149249784617n),
      new Timestamp(TimestampType.ELAPSED, 1149272993520n),
    ];
    expect(parser.getTimestamps(TimestampType.ELAPSED))
      .toEqual(expected);
  });

  it("retrieves trace entry", () => {
    const timestamp = new Timestamp(TimestampType.ELAPSED, 1149230019887n);
    expect(BigInt(parser.getTraceEntry(timestamp)!.elapsedRealtimeNanos))
      .toEqual(1149230019887n);
  });
});
