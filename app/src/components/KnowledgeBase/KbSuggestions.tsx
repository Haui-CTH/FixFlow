// SPDX-License-Identifier: Apache-2.0
// KbSuggestions (P5): Tự động tìm kiếm và gợi ý bài viết Knowledge Base từ AI Service (TF-IDF).
// Hiển thị trên màn hình tạo ticket và chi tiết ticket để hỗ trợ giải quyết sự cố tức thì.

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ExternalLink, Copy, Check } from 'lucide-react';
import { aiApi, type KbArticleHit, type KbArticleDetail } from '../../lib/api';
import { categoryMeta } from '../../lib/ticket-meta';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useDebounce } from '../../hooks/useDebounce';
import styles from './KnowledgeBase.module.css';
import { t } from '../../lib/i18n';

interface KbSuggestionsProps {
  query: string;
  category?: string;
  onInsert?: (content: string) => void;
  className?: string;
}

export function KbSuggestions({ query, category, onInsert, className }: KbSuggestionsProps) {
  const debouncedQuery = useDebounce(query, 400);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const shouldSearch = debouncedQuery.trim().length >= 3;

  const { data: hits = [], isLoading } = useQuery<KbArticleHit[]>({
    queryKey: ['kb-search', debouncedQuery, category],
    queryFn: () => aiApi.searchKb(debouncedQuery, category, 3),
    enabled: shouldSearch,
    staleTime: 60_000,
  });

  const { data: articleDetail, isLoading: isLoadingDetail } = useQuery<KbArticleDetail>({
    queryKey: ['kb-article', selectedArticleId],
    queryFn: () => aiApi.getKbArticle(selectedArticleId!),
    enabled: !!selectedArticleId,
    staleTime: 300_000,
  });

  if (!shouldSearch || (hits.length === 0 && !isLoading)) {
    return null;
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`${styles.kbCard} ${className ?? ''}`} aria-label="Knowledge Base Suggestions">
      <div className={styles.kbHeader}>
        <div className={styles.kbTitle}>
          <BookOpen size={18} aria-hidden="true" />
          <span>{t('kb.tai_lieu_goi_y')}</span>
        </div>
        {hits.length > 0 && (
          <span className={styles.kbBadge}>
            {hits.length} {t('kb.bai_viet')}
          </span>
        )}
      </div>

      <div className={styles.kbList}>
        {hits.map((hit) => {
          const cat = categoryMeta(hit.category);
          const matchPct = Math.round(Math.min(100, hit.score * 100));

          return (
            <div key={hit.id} className={styles.kbItem}>
              <div className={styles.kbItemTop}>
                <span className={styles.kbItemTitle}>{hit.title}</span>
                <span className={styles.kbItemScore}>{matchPct}%</span>
              </div>
              <p className={styles.kbSnippet}>{hit.snippet}</p>
              <div className={styles.kbItemActions}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => setSelectedArticleId(hit.id)}
                >
                  <ExternalLink size={13} aria-hidden="true" />
                  {t('kb.xem_chi_tiet')}
                </button>
                {onInsert && (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => onInsert(`\n[Tham khảo KB: ${hit.title}]\n${hit.snippet}`)}
                  >
                    <Copy size={13} aria-hidden="true" />
                    {t('kb.chen_vao_mo_ta')}
                  </button>
                )}
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => handleCopy(hit.id, `${hit.title}\n${hit.snippet}`)}
                >
                  {copiedId === hit.id ? (
                    <>
                      <Check size={13} aria-hidden="true" />
                      {t('kb.da_chep')}
                    </>
                  ) : (
                    t('kb.sao_chep')
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedArticleId && (
        <Modal
          open={!!selectedArticleId}
          title={articleDetail?.title ?? t('kb.chi_tiet_huong_dan')}
          onClose={() => setSelectedArticleId(null)}
        >
          {isLoadingDetail ? (
            <p>{t('kb.dang_tai')}</p>
          ) : articleDetail ? (
            <div>
              <div className={styles.articleMeta}>
                <span>{t('kb.danh_muc')}: {categoryMeta(articleDetail.category).label}</span>
                {articleDetail.tags && articleDetail.tags.length > 0 && (
                  <span>· Tags: {articleDetail.tags.join(', ')}</span>
                )}
              </div>
              <div className={styles.articleModalBody}>
                {articleDetail.body}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button variant="secondary" onClick={() => setSelectedArticleId(null)}>
                  {t('kb.dong')}
                </Button>
              </div>
            </div>
          ) : (
            <p>{t('kb.khong_tim_thay_bai_viet')}</p>
          )}
        </Modal>
      )}
    </div>
  );
}

