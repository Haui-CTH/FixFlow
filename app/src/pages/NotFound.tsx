// SPDX-License-Identifier: Apache-2.0
import { SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/States';
import { t } from '../lib/i18n';

export default function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      headingLevel={1}
      title={t('not_found.khong_tim_thay_trang')}
      description={t('not_found.duong_dan_khong_ton_tai_hoac_da_du')}
      action={<Link to="/">{t('not_found.ve_trang_chu')}</Link>}
    />
  );
}
