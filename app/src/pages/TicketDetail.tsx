// SPDX-License-Identifier: Apache-2.0
// DX-FSM Ticket Detail Page (GĐ 05): header, tabs (đồng bộ ?tab=), cột phụ AI, hành động theo role.

import { useQuery } from '@tanstack/react-query';
import { SearchX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { HistoryTimeline } from '../components/History/HistoryTimeline';
import { NotesPanel } from '../components/Notes/NotesPanel';
import { AiInsightsCard } from '../components/TicketDetail/AiInsightsCard';
import { AssignModal } from '../components/TicketDetail/AssignModal';
import { AttachmentsPanel } from '../components/TicketDetail/AttachmentsPanel';
import { CommentsPanel } from '../components/TicketDetail/CommentsPanel';
import { Overview } from '../components/TicketDetail/Overview';
import { StatusActions } from '../components/TicketDetail/StatusActions';
import styles from '../components/TicketDetail/TicketDetail.module.css';
import { TicketHeader } from '../components/TicketDetail/TicketHeader';
import { SkeletonBlock } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/States';
import { Tabs, tabPanelProps, type TabDef } from '../components/ui/Tabs';
import { useRole } from '../hooks/useRole';
import { attachmentApi, commentApi, ticketApi } from '../lib/api';

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const role = useRole();
  const [params, setParams] = useSearchParams();
  const [assignOpen, setAssignOpen] = useState(false);

  // Đồng hồ cho SLA, cập nhật mỗi phút
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const { data: ticket, isLoading, error, refetch } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketApi.get(id!).then((r) => r.data),
    enabled: !!id,
    retry: (n, e) => (e as { response?: { status?: number } })?.response?.status !== 404 && n < 1,
  });
  // Dùng chung cache với các tab để có số đếm
  const { data: comments } = useQuery({ queryKey: ['comments', id], queryFn: () => commentApi.list(id!), enabled: !!id });
  const { data: attachments } = useQuery({ queryKey: ['attachments', id], queryFn: () => attachmentApi.list(id!), enabled: !!id });

  const backTo = role === 'manager' || role === 'admin' ? '/tickets' : '/my-tickets';

  if (isLoading) {
    return (
      <div className={styles.page} role="status" aria-label="Đang tải ticket">
        <SkeletonBlock height={140} />
        <div className={styles.spacer} />
        <SkeletonBlock height={320} />
      </div>
    );
  }
  if (!ticket) {
    const notFound = (error as { response?: { status?: number } } | null)?.response?.status === 404;
    return notFound ? (
      <EmptyState
        icon={SearchX}
        headingLevel={1}
        title="Không tìm thấy ticket"
        description="Ticket không tồn tại hoặc bạn không có quyền xem."
        action={<Link to={backTo}>Về danh sách ticket</Link>}
      />
    ) : (
      <ErrorState headingLevel={1} title="Không tải được ticket" onRetry={() => refetch()} />
    );
  }

  const tabs: TabDef[] = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'comments', label: 'Bình luận', count: comments?.length },
    ...(role === 'customer' ? [] : [{ id: 'notes', label: 'Ghi chú nội bộ' }]),
    { id: 'attachments', label: 'Đính kèm', count: attachments?.length },
    { id: 'history', label: 'Lịch sử' },
  ];
  const requested = params.get('tab') ?? 'overview';
  const active = tabs.some((t) => t.id === requested) ? requested : 'overview';
  const setTab = (t: string) =>
    setParams((p) => {
      const n = new URLSearchParams(p);
      if (t === 'overview') n.delete('tab');
      else n.set('tab', t);
      return n;
    }, { replace: true });

  const canAssign = (role === 'manager' || role === 'admin') && (ticket.status === 'new' || ticket.status === 'assigned');

  return (
    <div className={styles.page}>
      <TicketHeader
        ticket={ticket}
        backTo={backTo}
        now={now}
        actions={<StatusActions ticket={ticket} role={role} onAssign={() => setAssignOpen(true)} />}
      />
      <div className={styles.layout}>
        <div className={styles.main}>
          <Tabs tabs={tabs} active={active} onChange={setTab} />
          <div {...tabPanelProps(active)} className={styles.panel}>
            {active === 'overview' && <Overview ticket={ticket} />}
            {active === 'comments' && <CommentsPanel ticketId={ticket.id} role={role} />}
            {active === 'notes' && <NotesPanel ticketId={ticket.id} />}
            {active === 'attachments' && <AttachmentsPanel ticketId={ticket.id} role={role} />}
            {active === 'history' && <HistoryTimeline ticketId={ticket.id} />}
          </div>
        </div>
        <aside className={styles.side} aria-label="Thông tin phụ">
          <AiInsightsCard ticket={ticket} canSuggest={canAssign} onSuggest={() => setAssignOpen(true)} />
        </aside>
      </div>
      {(role === 'manager' || role === 'admin') && (
        <AssignModal ticket={ticket} open={assignOpen} onClose={() => setAssignOpen(false)} />
      )}
    </div>
  );
}
