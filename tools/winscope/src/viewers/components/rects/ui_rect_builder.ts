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

import {TransformMatrix} from 'common/geometry_types';
import {UiRect} from './types2d';

export class UiRectBuilder {
  x: number | undefined;
  y: number | undefined;
  w: number | undefined;
  h: number | undefined;
  label: string | undefined;
  transform: TransformMatrix | undefined;
  isVisible: boolean | undefined;
  isDisplay: boolean | undefined;
  id: string | undefined;
  groupId: number | undefined;
  isVirtual: boolean | undefined;
  isClickable: boolean | undefined;
  cornerRadius: number | undefined;
  depth: number | undefined;
  hasContent: boolean | undefined;
  opacity: number | undefined;

  setX(value: number) {
    this.x = value;
    return this;
  }

  setY(value: number) {
    this.y = value;
    return this;
  }

  setWidth(value: number) {
    this.w = value;
    return this;
  }

  setHeight(value: number) {
    this.h = value;
    return this;
  }

  setLabel(value: string) {
    this.label = value;
    return this;
  }

  setTransform(value: TransformMatrix) {
    this.transform = value;
    return this;
  }

  setIsVisible(value: boolean) {
    this.isVisible = value;
    return this;
  }

  setIsDisplay(value: boolean) {
    this.isDisplay = value;
    return this;
  }

  setId(value: string) {
    this.id = value;
    return this;
  }

  setGroupId(value: number) {
    this.groupId = value;
    return this;
  }

  setIsVirtual(value: boolean) {
    this.isVirtual = value;
    return this;
  }

  setIsClickable(value: boolean) {
    this.isClickable = value;
    return this;
  }

  setCornerRadius(value: number) {
    this.cornerRadius = value;
    return this;
  }

  setDepth(value: number) {
    this.depth = value;
    return this;
  }

  setHasContent(value: boolean) {
    this.hasContent = value;
    return this;
  }

  setOpacity(value: number | undefined) {
    this.opacity = value;
    return this;
  }

  build(): UiRect {
    if (this.x === undefined) {
      throw Error('x not set');
    }

    if (this.y === undefined) {
      throw Error('y not set');
    }

    if (this.w === undefined) {
      throw Error('width not set');
    }

    if (this.h === undefined) {
      throw Error('height not set');
    }

    if (this.label === undefined) {
      throw Error('label not set');
    }

    if (this.isVisible === undefined) {
      throw Error('isVisible not set');
    }

    if (this.isDisplay === undefined) {
      throw Error('isDisplay not set');
    }

    if (this.id === undefined) {
      throw Error('id not set');
    }

    if (this.groupId === undefined) {
      throw Error('groupId not set');
    }

    if (this.isVirtual === undefined) {
      throw Error('isVirtual not set');
    }

    if (this.isClickable === undefined) {
      throw Error('isClickable not set');
    }

    if (this.cornerRadius === undefined) {
      throw Error('cornerRadius not set');
    }

    if (this.depth === undefined) {
      throw Error('depth not set');
    }

    return new UiRect(
      this.x,
      this.y,
      this.w,
      this.h,
      this.label,
      this.isVisible,
      this.isDisplay,
      this.id,
      this.groupId,
      this.isVirtual,
      this.isClickable,
      this.cornerRadius,
      this.transform,
      this.depth,
      this.hasContent,
      this.opacity,
    );
  }
}
