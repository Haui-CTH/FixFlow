// SPDX-License-Identifier: Apache-2.0
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileDropzone, validateFiles, MAX_FILE_BYTES } from './FileDropzone';

const f = (name: string, type: string, size = 10) => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('validateFiles', () => {
  it('accepts images and pdf, rejects others and oversize', () => {
    const { ok, errors } = validateFiles([
      f('a.png', 'image/png'),
      f('b.pdf', 'application/pdf'),
      f('c.exe', 'application/x-msdownload'),
      f('big.jpg', 'image/jpeg', MAX_FILE_BYTES + 1),
    ]);
    expect(ok.map((x) => x.name)).toEqual(['a.png', 'b.pdf']);
    expect(errors).toHaveLength(2);
  });
});

describe('FileDropzone', () => {
  it('has a keyboard-accessible choose button and removable files', () => {
    const onChange = vi.fn();
    const file = f('a.png', 'image/png');
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    render(<FileDropzone files={[file]} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Chọn file' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xoá a.png' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('reports an error for a bad file type', () => {
    render(<FileDropzone files={[]} onChange={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Chọn file đính kèm'), { target: { files: [f('x.exe', 'application/x-msdownload')] } });
    expect(screen.getByRole('alert')).toHaveTextContent('chỉ nhận ảnh');
  });
});
