// SPDX-License-Identifier: Apache-2.0
// DX-FSM Frontend – Vitest setup
// F5.1: Setup testing-library + jest-dom matchers.

import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
