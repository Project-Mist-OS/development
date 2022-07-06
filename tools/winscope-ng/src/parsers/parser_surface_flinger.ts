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
import {LayerTraceEntry} from 'common/trace/flickerlib/layers/LayerTraceEntry';
import {TraceTypeId} from "common/trace/type_id";
import {Parser} from './parser'
import {LayersTraceFileProto} from './proto_types';

class ParserSurfaceFlinger extends Parser {
  constructor(buffer: Uint8Array) {
    super(buffer);
  }

  override getTraceTypeId(): TraceTypeId {
    return TraceTypeId.SURFACE_FLINGER;
  }

  override getMagicNumber(): number[] {
    return ParserSurfaceFlinger.MAGIC_NUMBER;
  }

  override decodeProto(buffer: Uint8Array): any[] {
    return (<any>LayersTraceFileProto.decode(buffer)).entry;
  }

  override getTimestamp(entryProto: any): number {
    return Number(entryProto.elapsedRealtimeNanos);
  }

  override processTraceEntryProto(entryProto: any): any {
    return LayerTraceEntry.fromProto(entryProto.layers.layers, entryProto.displays, entryProto.elapsedRealtimeNanos, entryProto.hwcBlob);
  }

  private static readonly MAGIC_NUMBER = [0x09, 0x4c, 0x59, 0x52, 0x54, 0x52, 0x41, 0x43, 0x45]; // .LYRTRACE
}

export { ParserSurfaceFlinger };
