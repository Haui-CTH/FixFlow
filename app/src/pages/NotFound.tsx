// SPDX-License-Identifier: Apache-2.0
import { SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/States';

export default function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      headingLevel={1}
      title="Không tìm thấy trang"
      description="Đường dẫn không tồn tại hoặc đã được di chuyển."
      action={<Link to="/">Về trang chủ</Link>}
    />
  );
}
