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
import { KbSuggestions } from '../components/KnowledgeBase/KbSuggestions';
import styles from '../components/Tickets/TicketCreate.module.css';
import { useRole } from '../hooks/useRole';
import { aiApi, attachmentApi, ticketApi, type AiClassifyResult } from '../lib/api';
import { CATEGORY_META, CATEGORY_VALUES } from '../lib/ticket-meta';
import { toastApi } from '../lib/toast';
import { t } from '../lib/i18n';

interface FormValues {
  title: string;
  description: string;
  category: string;
  priority: string;
  customer_location: string;
}

interface IncidentPreset {
  tag: string;
  title: string;
  category: string;
  priority: string;
  location: string;
  description: string;
}

const HAUI_PRESETS: IncidentPreset[] = [
  {
    tag: '📽️ Máy chiếu (Tòa A1)',
    title: 'Máy chiếu không nhận tín hiệu HDMI / VGA',
    category: 'hardware',
    priority: 'urgent',
    location: 'Tòa A1 - Phòng 305',
    description: 'Máy chiếu bật nguồn đèn nháy đỏ, cắm cáp HDMI vào laptop không hiển thị hình ảnh giảng dạy.',
  },
  {
    tag: '📶 Mạng Lab (Nhà A2)',
    title: 'Mất mạng Internet toàn bộ phòng máy thực hành',
    category: 'network',
    priority: 'critical',
    location: 'Nhà A2 - Lab 402',
    description: 'Tất cả các máy trạm trong phòng máy bị ngắt kết nối mạng LAN, switch trung tâm nháy đèn cam.',
  },
  {
    tag: '❄️ Điều hòa (Khu B)',
    title: 'Điều hòa nhiệt độ thổi gió nóng và chảy nước',
    category: 'electrical',
    priority: 'medium',
    location: 'Xưởng Cơ khí Nhà B',
    description: 'Điều hòa phòng học bật 18 độ nhưng chỉ ra gió nóng, có hiện tượng nước ngưng rò rỉ xuống sàn.',
  },
  {
    tag: '🚪 Khóa từ (Khảo thí)',
    title: 'Hệ thống kiểm soát ra vào bị lỗi thẻ từ',
    category: 'access_control',
    priority: 'high',
    location: 'Trung tâm Khảo thí',
    description: 'Đầu đọc thẻ RFID liên tục báo tít dài màu đỏ, giảng viên và sinh viên không quét thẻ vào được.',
  },
];

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
    register('priority', { required: t('ticket_create.hay_chon_muc_uu_tien') });
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
        setProgress(t('ticket_create.uploading', { i: i + 1, n: files.length }));
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
      if (failed > 0) toastApi.warning(t('ticket_create.upload_failed', { count: failed }));
      else toastApi.success(t('ticket_create.created', { number: ticket.ticket_number }));
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
    const list = Object.entries(errs).map(([name, e]) => ({ name, message: String(e?.message ?? t('ticket_create.gia_tri_khong_hop_le')) }));
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
      toastApi.info(t('ticket_create.chua_lay_duoc_goi_y_ai_ban_van_co'));
    } finally {
      setAiBusy(false);
    }
  };
  const applyAi = (r: AiClassifyResult) => {
    const opts = { shouldDirty: true, shouldValidate: true };
    if (CATEGORY_VALUES.includes(r.category)) setValue('category', r.category, opts);
    setValue('priority', r.priority, opts);
  };

  const applyPreset = (p: IncidentPreset) => {
    const opts = { shouldDirty: true, shouldValidate: true };
    setValue('title', p.title, opts);
    setValue('category', p.category, opts);
    setValue('priority', p.priority, opts);
    setValue('customer_location', p.location, opts);
    setValue('description', p.description, opts);
  };

  const cancel = () => navigate(role === 'customer' ? '/my-tickets' : '/tickets');

  return (
    <div className={styles.page}>
      <PageHeader title={t('ticket_create.tao_ticket')} description={t('ticket_create.la_thong_tin_bat_buoc')} />
      <form noValidate onSubmit={handleSubmit((v) => create.mutate(v), onInvalid)} className={styles.form}>
        <ErrorSummary errors={summary} />

        <div className={styles.presetSection}>
          <div className={styles.presetTitle}>Sự cố thường gặp tại HaUI (chọn nhanh 1 chạm):</div>
          <div className={styles.presetList}>
            {HAUI_PRESETS.map((p) => (
              <button
                type="button"
                key={p.tag}
                onClick={() => applyPreset(p)}
                className={styles.presetBtn}
              >
                {p.tag}
              </button>
            ))}
          </div>
        </div>

        <fieldset className={styles.group}>
          <legend>{t('ticket_create.thong_tin_su_co')}</legend>
          <Input
            label={t('ticket_create.tieu_de')}
            maxLength={200}
            error={errors.title?.message}
            {...register('title', {
              required: t('ticket_create.hay_nhap_tieu_de'),
              minLength: { value: 5, message: t('ticket_create.tieu_de_can_it_nhat_5_ky_tu') },
              maxLength: { value: 200, message: t('ticket_create.tieu_de_toi_da_200_ky_tu') },
            })}
          />
          <Textarea
            label={t('ticket_create.mo_ta')}
            helper={t('ticket_create.description_helper', { count: description?.length ?? 0 })}
            error={errors.description?.message}
            {...register('description', {
              required: t('ticket_create.hay_nhap_mo_ta'),
              minLength: { value: 10, message: t('ticket_create.mo_ta_can_it_nhat_10_ky_tu') },
            })}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--color-text-muted, #64748b)", marginTop: "6px" }}>
            <span aria-hidden="true">🔒</span>
            <span>Bảo vệ quyền riêng tư theo <strong>Nghị định 13/2023/NĐ-CP</strong>: Hệ thống tự động ẩn danh SĐT, Email, CCCD và Tên riêng trước khi xử lý AI.</span>
          </div>
        </fieldset>

        <KbSuggestions
          query={title || ''}
          category={watch('category') || undefined}
          onInsert={(text) =>
            setValue('description', (description || '') + text, { shouldDirty: true, shouldValidate: true })
          }
        />

        <fieldset className={styles.group}>
          <legend>{t('ticket_create.phan_loai')}</legend>
          <Select label={t('ticket_create.danh_muc')} error={errors.category?.message} {...register('category', { required: t('ticket_create.pick_category') })}>
            <option value="">{t('ticket_create.chon_danh_muc')}</option>
            {CATEGORY_VALUES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].label}
              </option>
            ))}
          </Select>
          <div>
            <span className={styles.legendLike}>{t('ticket_create.muc_uu_tien')}</span>
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
              {t('ticket_create.goi_y_bang_ai')}
            </Button>
            {!canAsk && <span className={styles.hint}>{t('ticket_create.nhap_tieu_de_va_mo_ta_de_dung_goi')}</span>}
          </div>
          {ai && <AiSuggestion result={ai.result} applied={ai.applied} onApply={() => { applyAi(ai.result); setAi({ ...ai, applied: true }); }} />}
        </fieldset>

        <fieldset className={styles.group}>
          <legend>{t('ticket_create.dia_diem')}</legend>
          <Input label={t('ticket_create.dia_chi_vi_tri')} autoComplete="street-address" {...register('customer_location')} />
        </fieldset>

        <fieldset className={styles.group}>
          <legend>{t('ticket_create.dinh_kem_tuy_chon')}</legend>
          <FileDropzone files={files} onChange={setFiles} />
        </fieldset>

        <div className={styles.actions}>
          {progress && <span role="status">{progress}</span>}
          <Button variant="secondary" onClick={cancel} disabled={create.isPending}>
            {t('ticket_create.huy')}
          </Button>
          <Button type="submit" loading={create.isPending}>
            {t('ticket_create.tao_ticket')}
          </Button>
        </div>
      </form>
    </div>
  );
}
