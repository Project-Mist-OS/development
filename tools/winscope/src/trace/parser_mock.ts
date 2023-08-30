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

import {ObjectUtils} from 'common/object_utils';
import {RealTimestamp, Timestamp, TimestampType} from '../common/time';
import {AbsoluteEntryIndex, EntriesRange} from './index_types';
import {Parser} from './parser';
import {TraceType} from './trace_type';

export class ParserMock<T> implements Parser<T> {
  constructor(private readonly timestamps: RealTimestamp[], private readonly entries: T[]) {
    if (timestamps.length !== entries.length) {
      throw new Error(`Timestamps and entries must have the same length`);
    }
  }

  getTraceType(): TraceType {
    return TraceType.SURFACE_FLINGER;
  }

  getLengthEntries(): number {
    return this.entries.length;
  }

  getTimestamps(type: TimestampType): Timestamp[] | undefined {
    if (type !== TimestampType.REAL) {
      throw new Error('Parser mock contains only real timestamps');
    }
    return this.timestamps;
  }

  getEntry(index: AbsoluteEntryIndex): Promise<T> {
    return Promise.resolve(this.entries[index]);
  }

  getPartialProtos(entriesRange: EntriesRange, fieldPath: string): Promise<object[]> {
    const partialEntries = this.entries.slice(entriesRange.start, entriesRange.end).map((entry) => {
      const fieldValue = ObjectUtils.getProperty(entry as object, fieldPath);
      const proto = {};
      ObjectUtils.setProperty(proto, fieldPath, fieldValue);
      return proto;
    });
    return Promise.resolve(partialEntries);
  }

  getDescriptors(): string[] {
    return ['MockTrace'];
  }
}
