// SPDX-License-Identifier: Apache-2.0
// DX-FSM Frontend – Vitest setup
// F5.1: Setup testing-library + jest-dom matchers.

import '@testing-library/jest-dom';
import { afterEach, beforeEach } from 'vitest';
import i18n from '../lib/i18n';
import { cleanup } from '@testing-library/react';

// Test chạy bằng tiếng Việt (ngôn ngữ mặc định của app) trừ khi test tự đổi
beforeEach(async () => {
  await i18n.changeLanguage('vi');
});

afterEach(() => {
  cleanup();
});
