// SPDX-License-Identifier: Apache-2.0
// FileDropzone (C4.7): kéo-thả + nút chọn file, chỉ ảnh/PDF, giới hạn dung lượng, preview, xoá.

import { FileText, Paperclip, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './Button';
import styles from './ui.module.css';

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // khớp BE (attachments.py)
const ACCEPT = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

// Trả về file hợp lệ + danh sách lỗi (thuần để test)
export function validateFiles(incoming: File[]): { ok: File[]; errors: string[] } {
  const ok: File[] = [];
  const errors: string[] = [];
  for (const f of incoming) {
    if (!ACCEPT.includes(f.type)) errors.push(`"${f.name}": chỉ nhận ảnh (JPG, PNG, GIF, WebP) hoặc PDF`);
    else if (f.size > MAX_FILE_BYTES) errors.push(`"${f.name}": vượt quá 10 MB`);
    else ok.push(f);
  }
  return { ok, errors };
}

const kb = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export function FileDropzone({ files, onChange, max = 5 }: { files: File[]; onChange: (f: File[]) => void; max?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const add = (list: FileList | File[]) => {
    const { ok, errors: errs } = validateFiles(Array.from(list));
    const room = max - files.length;
    if (ok.length > room) errs.push(`Tối đa ${max} file`);
    setErrors(errs);
    if (ok.length) onChange([...files, ...ok.slice(0, Math.max(room, 0))]);
  };

  const previews = useMemo(() => files.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null)), [files]);
  useEffect(() => () => previews.forEach((u) => u && URL.revokeObjectURL(u)), [previews]);

  return (
    <div>
      <div
        className={`${styles.dropzone} ${over ? styles.dropzoneOver : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          add(e.dataTransfer.files);
        }}
      >
        <Paperclip size={24} aria-hidden="true" />
        <p>Kéo thả ảnh/PDF vào đây hoặc</p>
        <Button variant="secondary" onClick={() => input.current?.click()}>
          Chọn file
        </Button>
        <p className={styles.helper}>Tối đa {max} file, mỗi file ≤ 10 MB</p>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept={ACCEPT.join(',')}
          aria-label="Chọn file đính kèm"
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {errors.length > 0 && (
        <ul className={styles.error} role="alert">
          {errors.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <ul className={styles.fileList} aria-label="File đã chọn">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              {previews[i] ? <img src={previews[i]!} alt="" width={40} height={40} /> : <FileText size={40} aria-hidden="true" />}
              <span className={styles.fileName}>{f.name}</span>
              <span className={styles.helper}>{kb(f.size)}</span>
              <Button variant="ghost" iconOnly aria-label={`Xoá ${f.name}`} onClick={() => onChange(files.filter((_, j) => j !== i))}>
                <X size={18} aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
