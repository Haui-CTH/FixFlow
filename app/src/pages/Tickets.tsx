// SPDX-License-Identifier: Apache-2.0
// DX-FSM Tickets Page (GĐ 03): tìm/lọc/sắp xếp/phân trang phía server, trạng thái lưu trên URL.

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Plus, SearchX, Ticket as TicketIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SkeletonRows } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/Card';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState, ErrorState } from '../components/ui/States';
import { TicketCard } from '../components/Tickets/TicketCard';
import { TicketFilters, type Filters } from '../components/Tickets/TicketFilters';
import { TicketTable, type Sort } from '../components/Tickets/TicketTable';
import styles from '../components/Tickets/Tickets.module.css';
import { useDebounce } from '../hooks/useDebounce';
import { useRole } from '../hooks/useRole';
import { ticketApi } from '../lib/api';
import { t } from '../lib/i18n';

const DEFAULT_SORT = 'created_at:desc';
const FILTER_KEYS = ['q', 'status', 'priority', 'category'] as const;

export default function Tickets({ mine = false }: { mine?: boolean }) {
  const [params, setParams] = useSearchParams();
  const role = useRole();

  const filters: Filters = {
    q: params.get('q') ?? '',
    status: params.get('status') ?? '',
    priority: params.get('priority') ?? '',
    category: params.get('category') ?? '',
  };
  const sortRaw = params.get('sort') ?? DEFAULT_SORT;
  const [sortBy, sortDirRaw] = sortRaw.split(':');
  const sort: Sort = { by: sortBy, dir: sortDirRaw === 'asc' ? 'asc' : 'desc' };
  const size = Number(params.get('size')) || 20;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const update = (patch: Record<string, string>, keepPage = false) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v) next.set(k, v);
          else next.delete(k);
        }
        if (!keepPage) next.delete('page');
        return next;
      },
      { replace: true },
    );

  // Ô tìm kiếm: gõ cục bộ, đẩy lên URL sau 300ms
  const [qInput, setQInput] = useState(filters.q);
  const qDebounced = useDebounce(qInput, 300);
  useEffect(() => {
    if (qDebounced !== filters.q) update({ q: qDebounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced]);

  // Đồng hồ cho SLA, cập nhật mỗi phút
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['tickets', mine, filters, sort, page, size],
    queryFn: () =>
      ticketApi.list({
        mine: mine || undefined,
        q: filters.q || undefined,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        category: filters.category || undefined,
        sort_by: sort.by,
        sort_dir: sort.dir,
        limit: size,
        offset: (page - 1) * size,
      }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const tickets = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasFilters = FILTER_KEYS.some((k) => filters[k]);
  const canCreate = role === 'customer' || role === 'manager' || role === 'admin';
  const clearAll = () => {
    setQInput('');
    update({ q: '', status: '', priority: '', category: '' });
  };
  const toggleSort = (by: string) =>
    update({ sort: `${by}:${sort.by === by && sort.dir === 'desc' ? 'asc' : 'desc'}` });

  const createBtn = canCreate && (
    <Link to="/tickets/new" className={styles.createLink}>
      <Plus size={18} aria-hidden="true" />
      {t('tickets.tao_ticket')}
    </Link>
  );

  let body;
  if (isError && !data) {
    body = <ErrorState title={t('tickets.khong_tai_duoc_danh_sach_ticket')} message={t('tickets.kiem_tra_ket_noi_roi_thu_lai')} onRetry={() => refetch()} />;
  } else if (isLoading) {
    body = <SkeletonRows rows={8} />;
  } else if (tickets.length === 0) {
    body = hasFilters ? (
      <EmptyState
        icon={SearchX}
        title={t('tickets.khong_co_ticket_khop_bo_loc')}
        description={t('tickets.thu_doi_tu_khoa_hoac_bo_bot_bo_loc')}
        action={
          <Button variant="secondary" onClick={clearAll}>
            {t('tickets.xoa_loc')}
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={TicketIcon}
        title={t('tickets.chua_co_ticket_nao')}
        description={canCreate ? t('tickets.hay_tao_ticket_dau_tien') : undefined}
        action={canCreate ? createBtn : undefined}
      />
    );
  } else {
    body = (
      <>
        <div className={styles.desktopOnly}>
          <TicketTable tickets={tickets} sort={sort} onSort={toggleSort} now={now} />
        </div>
        <div className={styles.cardList}>
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} now={now} />
          ))}
        </div>
        <Pagination
          page={page}
          size={size}
          total={total}
          onPage={(p) => update({ page: String(p) }, true)}
          onSize={(s) => update({ size: s === 20 ? '' : String(s) })}
        />
      </>
    );
  }

  return (
    <div>
      <PageHeader title={`${mine ? t('tickets.ticket_cua_toi') : t('tickets.tat_ca_ticket')}${data ? ` (${total})` : ''}`} actions={createBtn || undefined} />
      <TicketFilters
        filters={{ ...filters, q: qInput }}
        sort={sortRaw}
        onChange={(patch) => {
          if ('q' in patch) setQInput(patch.q ?? '');
          else update(patch as Record<string, string>);
        }}
        onSort={(v) => update({ sort: v === DEFAULT_SORT ? '' : v })}
        onClear={clearAll}
      />
      {body}
    </div>
  );
}
