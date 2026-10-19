// SPDX-License-Identifier: Apache-2.0
// DX-FSM TicketCreate (GĐ 04): tạo ticket + AI gợi ý + đính kèm; nháp lưu sessionStorage.

import { useMutation } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { AiSuggestion, AUTO_APPLY_CONFIDENCE } from '../components/Tickets/AiSuggestion';
import { PrioritySelector } from '../components/Tickets/PrioritySelector';
import { Button } from '../components/ui/Button';
import { ErrorSummary, type FieldError } from '../components/ui/ErrorSummary';
import { Input, Select, Textarea } from '../components/ui/Field';
import { FileDropzone } from '../components/ui/FileDropzone';
import { PageHeader } from '../components/ui/Card';
import styles from '../components/Tickets/TicketCreate.module.css';
import { useRole } from '../hooks/useRole';
import { aiApi, attachmentApi, ticketApi, type AiClassifyResult } from '../lib/api';
import { CATEGORY_META, CATEGORY_VALUES } from '../lib/ticket-meta';
import { toastApi } from '../lib/toast';

interface FormValues {
  title: string;
  description: string;
  category: string;
  priority: string;
  customer_location: string;
}

const DRAFT_KEY = 'dxfsm-ticket-draft';
const EMPTY: FormValues = { title: '', description: '', category: '', priority: 'medium', customer_location: '' };

function loadDraft(): FormValues {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}
const saveDraft = (v: FormValues) => {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(v));
  } catch {
    /* storage bị chặn: bỏ qua */
  }
};
const clearDraft = () => {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* bỏ qua */
  }
};

export default function TicketCreate() {
  const navigate = useNavigate();
  const role = useRole();
  const {
    register, handleSubmit, watch, setValue, setFocus,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ mode: 'onBlur', defaultValues: loadDraft(), shouldFocusError: false });

  const [files, setFiles] = useState<File[]>([]);
  const [summary, setSummary] = useState<FieldError[]>([]);
  const [progress, setProgress] = useState('');
  const [ai, setAi] = useState<{ result: AiClassifyResult; applied: boolean } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const title = watch('title');
  const description = watch('description');
  const priority = watch('priority');
  const canAsk = (title?.trim().length ?? 0) >= 5 && (description?.trim().length ?? 0) >= 10;

  // priority không có ô nhập thật: đăng ký để validate
  useEffect(() => {
    register('priority', { required: 'Hãy chọn mức ưu tiên' });
  }, [register]);

  // Nháp: lưu mỗi lần đổi
  useEffect(() => {
    const sub = watch((v) => saveDraft(v as FormValues));
    return () => sub.unsubscribe();
  }, [watch]);

  const create = useMutation({
    mutationFn: async (v: FormValues) => {
      const ticket = await ticketApi.create({
        title: v.title.trim(),
        description: v.description.trim(),
        category: v.category,
        priority: v.priority,
        customer_location: v.customer_location.trim() || undefined,
      });
      let failed = 0;
      for (let i = 0; i < files.length; i++) {
        setProgress(`Đang tải lên file ${i + 1}/${files.length}…`);
        try {
          await attachmentApi.upload(ticket.id, files[i]);
        } catch {
          failed++;
        }
      }
      return { ticket, failed };
    },
    onSuccess: ({ ticket, failed }) => {
      clearDraft();
      if (failed > 0) toastApi.warning(`${failed} file chưa tải lên được. Bạn có thể thêm lại trong trang chi tiết.`);
      else toastApi.success(`Đã tạo ticket ${ticket.ticket_number}`);
      navigate(`/tickets/${ticket.id}`, { replace: true });
    },
    onSettled: () => setProgress(''),
  });

  // Cảnh báo khi rời trang có thay đổi chưa lưu (BrowserRouter không có useBlocker)
  useEffect(() => {
    if (!isDirty || create.isPending) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty, create.isPending]);

  const onInvalid = (errs: typeof errors) => {
    const list = Object.entries(errs).map(([name, e]) => ({ name, message: String(e?.message ?? 'Giá trị không hợp lệ') }));
    if (list.length === 1) {
      setSummary([]);
      const n = list[0].name;
      if (n === 'priority') document.querySelector<HTMLElement>('[name="priority"]')?.focus();
      else setFocus(n as keyof FormValues);
    } else setSummary(list);
  };

  const askAi = async () => {
    setAiBusy(true);
    try {
      const r = await aiApi.classify(title.trim(), description.trim());
      const auto = r.confidence > AUTO_APPLY_CONFIDENCE;
      if (auto) applyAi(r);
      setAi({ result: r, applied: auto });
    } catch {
      toastApi.info('Chưa lấy được gợi ý AI. Bạn vẫn có thể tự chọn danh mục và mức ưu tiên.');
    } finally {
      setAiBusy(false);
    }
  };
  const applyAi = (r: AiClassifyResult) => {
    const opts = { shouldDirty: true, shouldValidate: true };
    if (CATEGORY_VALUES.includes(r.category)) setValue('category', r.category, opts);
    setValue('priority', r.priority, opts);
  };

  const cancel = () => navigate(role === 'customer' ? '/my-tickets' : '/tickets');

  return (
    <div className={styles.page}>
      <PageHeader title="Tạo ticket" description="* là thông tin bắt buộc" />
      <form noValidate onSubmit={handleSubmit((v) => create.mutate(v), onInvalid)} className={styles.form}>
        <ErrorSummary errors={summary} />

        <fieldset className={styles.group}>
          <legend>Thông tin sự cố</legend>
          <Input
            label="Tiêu đề *"
            maxLength={200}
            error={errors.title?.message}
            {...register('title', {
              required: 'Hãy nhập tiêu đề',
              minLength: { value: 5, message: 'Tiêu đề cần ít nhất 5 ký tự' },
              maxLength: { value: 200, message: 'Tiêu đề tối đa 200 ký tự' },
            })}
          />
          <Textarea
            label="Mô tả *"
            helper={`Nêu thiết bị, triệu chứng, thời điểm xảy ra. (${description?.length ?? 0} ký tự)`}
            error={errors.description?.message}
            {...register('description', {
              required: 'Hãy nhập mô tả',
              minLength: { value: 10, message: 'Mô tả cần ít nhất 10 ký tự' },
            })}
          />
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Phân loại</legend>
          <Select label="Danh mục *" error={errors.category?.message} {...register('category', { required: 'Hãy chọn danh mục' })}>
            <option value="">Chọn danh mục…</option>
            {CATEGORY_VALUES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].label}
              </option>
            ))}
          </Select>
          <div>
            <span className={styles.legendLike}>Mức ưu tiên *</span>
            <PrioritySelector
              value={priority}
              error={errors.priority?.message}
              onChange={(v) => setValue('priority', v, { shouldDirty: true, shouldValidate: true })}
            />
            {errors.priority && (
              <span className={styles.err} role="alert">
                {errors.priority.message}
              </span>
            )}
          </div>
          <div>
            <Button variant="secondary" onClick={askAi} loading={aiBusy} disabled={!canAsk}>
              <Sparkles size={16} aria-hidden="true" />
              Gợi ý bằng AI
            </Button>
            {!canAsk && <span className={styles.hint}> Nhập tiêu đề và mô tả để dùng gợi ý.</span>}
          </div>
          {ai && <AiSuggestion result={ai.result} applied={ai.applied} onApply={() => { applyAi(ai.result); setAi({ ...ai, applied: true }); }} />}
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Địa điểm</legend>
          <Input label="Địa chỉ / vị trí" autoComplete="street-address" {...register('customer_location')} />
        </fieldset>

        <fieldset className={styles.group}>
          <legend>Đính kèm (tuỳ chọn)</legend>
          <FileDropzone files={files} onChange={setFiles} />
        </fieldset>

        <div className={styles.actions}>
          {progress && <span role="status">{progress}</span>}
          <Button variant="secondary" onClick={cancel} disabled={create.isPending}>
            Huỷ
          </Button>
          <Button type="submit" loading={create.isPending}>
            Tạo ticket
          </Button>
        </div>
      </form>
    </div>
  );
}
