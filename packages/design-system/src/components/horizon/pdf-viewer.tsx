'use client';

import type React from 'react';
import { useCallback, useEffect, useId, useState } from 'react';
import { format } from 'date-fns';

import { IGRPColors } from '../../lib/colors';
import { DD_MM_YYYY } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { Card, CardHeader, CardTitle } from '../primitives/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../primitives/dialog';
import { IGRPBadge } from './badge';
import { IGRPButton } from './button';
import { IGRPIcon } from './icon';
import { IGRPLoadingSpinner } from './loading-spiner';
import { IGRPHeadline } from './typography/headline';
import { IGRPText } from './typography/text';

type IGRPDocumentItem = {
  id: number;
  title: string;
  description: string;
  author: string;
  date?: string | Date;
  fileUrl: string;
};

interface IGRPPdfViewerProps {
  document: IGRPDocumentItem;
  displayMode?: 'modal' | 'inline';
  labelButtonCancel?: string;
  labelButtonNewTab?: string;
  inlineHeight?: string;
  loadErrorLabel?: string;
  loadTimeoutMs?: number;
  viewerPreference?: 'google' | 'native' | 'auto';
  notFoundLabel?: string;
  name?: string;
  id?: string;
  className?: string;
}

const safeFormatDate = (date?: string | Date) => {
  if (!date) return '—';

  const parsed = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsed.getTime())) return '—';

  return format(parsed, DD_MM_YYYY);
};

const openDocNewTab = (fileUrl: string) => {
  const newWindow = window.open(fileUrl, '_blank', 'noopener,noreferrer');

  if (newWindow) newWindow.opener = null;
};

function IGRPPdfViewer({
  document,
  displayMode = 'modal',
  labelButtonCancel = 'Close',
  labelButtonNewTab = 'Open in new tab',
  inlineHeight = '50vh',
  loadErrorLabel = 'Could not load PDF',
  loadTimeoutMs = 8000,
  viewerPreference = 'google',
  notFoundLabel = 'No File found',
  name,
  id,
  className,
}: IGRPPdfViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState<IGRPDocumentItem>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const _id = useId();
  const ref = name ?? id ?? _id;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  const handleDocumentClick = useCallback(
    (doc: IGRPDocumentItem) => {
      if (displayMode === 'modal') {
        setSelectedDocument(doc);
        setIsModalOpen(true);
      }
    },
    [displayMode],
  );

  if (loading) return <IGRPLoadingSpinner />;

  if (!document) {
    return (
      <div className="flex items-center gap-3" id={ref}>
        <IGRPIcon iconName="FileX2" className={IGRPColors.solid.destructive.text} />
        <IGRPText as="p" size="default" weight="semibold" spacing="none">
          {notFoundLabel}
        </IGRPText>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)} id={ref}>
      {displayMode === 'inline' && (
        <IGRPPdfViewerInline
          document={document}
          labelButtonNewTab={labelButtonNewTab}
          height={inlineHeight}
          loadErrorLabel={loadErrorLabel}
          loadTimeoutMs={loadTimeoutMs}
          viewerPreference={viewerPreference}
        />
      )}

      {displayMode === 'modal' && (
        <>
          <IGRPPdfViewerCard
            key={document.id}
            document={document}
            onView={handleDocumentClick}
            clickable={displayMode === 'modal'}
          />
          <IGRPPdfViewerModal
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            document={selectedDocument || null}
            labelButtonCancel={labelButtonCancel}
            labelButtonNewTab={labelButtonNewTab}
            loadErrorLabel={loadErrorLabel}
            loadTimeoutMs={loadTimeoutMs}
            viewerPreference={viewerPreference}
          />
        </>
      )}
    </div>
  );
}

type IGRPPdfViewerCardProps = {
  document: IGRPDocumentItem;
  onView: (doc: IGRPDocumentItem) => void;
  clickable?: boolean;
};

function IGRPPdfViewerCard({ document, onView, clickable = true }: IGRPPdfViewerCardProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!clickable) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onView(document);
    }
  };

  return (
    <Card
      key={document.id}
      className={`transition-all py-3 ${clickable ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={clickable ? () => onView(document) : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <CardHeader className="gap-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <IGRPIcon iconName="FileText" className="text-muted-foreground" />
            <CardTitle className="text-sm font-medium leading-tight">{document.title}</CardTitle>
          </div>
          <IGRPBadge variant="soft" color="destructive" badgeClassName="px-3">
            PDF
          </IGRPBadge>
        </div>
      </CardHeader>
    </Card>
  );
}

type IGRPPdfViewerInlineProps = {
  document: IGRPDocumentItem;
  labelButtonNewTab?: string;
  height?: string;
  loadErrorLabel?: string;
  loadTimeoutMs?: number;
  viewerPreference?: 'google' | 'native' | 'auto';
};

function IGRPPdfViewerInline({
  document,
  labelButtonNewTab = 'Open in new tab',
  height = '50vh',
  loadErrorLabel = 'Could not load PDF',
  loadTimeoutMs = 8000,
  viewerPreference = 'auto',
}: IGRPPdfViewerInlineProps) {
  const { fileUrl, title, author, date } = document;
  const [frameStatus, setFrameStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [viewerEngine, setViewerEngine] = useState<'google' | 'native'>(
    viewerPreference === 'native' ? 'native' : 'google',
  );

  useEffect(() => {
    setFrameStatus('loading');
    setViewerEngine(viewerPreference === 'native' ? 'native' : 'google');
  }, [fileUrl, viewerPreference]);

  const handleFrameLoad = () => setFrameStatus('loaded');
  const handleFrameError = () => {
    if (viewerPreference === 'auto' && viewerEngine === 'google') {
      setViewerEngine('native');
      setFrameStatus('loading');
      return;
    }

    setFrameStatus('error');
  };

  useEffect(() => {
    if (frameStatus !== 'loading') return;

    const timeout = setTimeout(() => {
      setFrameStatus((status) => {
        if (status !== 'loading') return status;

        if (viewerPreference === 'auto' && viewerEngine === 'google') {
          setViewerEngine('native');
          return 'loading';
        }

        return 'error';
      });
    }, loadTimeoutMs);

    return () => clearTimeout(timeout);
  }, [frameStatus, loadTimeoutMs, viewerEngine, viewerPreference]);

  const iframeSrc =
    viewerEngine === 'google'
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
      : fileUrl;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <IGRPHeadline variant="h6" title={title} />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 text-xs">
                <IGRPIcon iconName="User" className="text-primary" />
                {author}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <IGRPIcon iconName="Calendar" className="text-primary" />
                {safeFormatDate(date)}
              </div>
            </div>
          </div>

          <IGRPButton
            variant="default"
            onClick={() => openDocNewTab(fileUrl)}
            showIcon
            iconName="ExternalLink"
            size="sm"
            aria-label={`${labelButtonNewTab} ${title}`}
          >
            {labelButtonNewTab}
          </IGRPButton>
        </div>
      </div>

      <div
        className="w-full bg-gray-100 rounded-lg overflow-hidden relative"
        style={{ height }}
        aria-busy={frameStatus === 'loading'}
      >
        {frameStatus === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <IGRPLoadingSpinner />
          </div>
        )}

        {frameStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 text-sm text-muted-foreground">
            <IGRPIcon iconName="AlertCircle" className="text-destructive" />
            <span>{loadErrorLabel}</span>
          </div>
        )}

        <iframe
          src={iframeSrc}
          className={cn('w-full h-full border-0', frameStatus === 'error' ? 'hidden' : 'block')}
          title={`PDF Viewer - ${title}`}
          aria-label={`PDF Viewer for ${title}`}
          loading="lazy"
          onLoad={handleFrameLoad}
          onError={handleFrameError}
        />
      </div>
    </div>
  );
}

type IGRPPdfViewerModalProps = {
  open: boolean;
  document: IGRPDocumentItem | null;
  onClose: (open: boolean) => void;
  labelButtonCancel?: string;
  labelButtonNewTab?: string;
  loadErrorLabel?: string;
  loadTimeoutMs?: number;
  viewerPreference?: 'google' | 'native' | 'auto';
};

function IGRPPdfViewerModal({
  open,
  document,
  onClose,
  labelButtonCancel,
  labelButtonNewTab,
  loadErrorLabel = 'Could not load PDF',
  loadTimeoutMs = 8000,
  viewerPreference = 'auto',
}: IGRPPdfViewerModalProps) {
  if (!document) return null;

  const { fileUrl, title, author, date } = document;
  const [frameStatus, setFrameStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [viewerEngine, setViewerEngine] = useState<'google' | 'native'>(
    viewerPreference === 'native' ? 'native' : 'google',
  );

  useEffect(() => {
    setFrameStatus('loading');
    setViewerEngine(viewerPreference === 'native' ? 'native' : 'google');
  }, [fileUrl, viewerPreference]);

  const handleFrameLoad = () => setFrameStatus('loaded');
  const handleFrameError = () => {
    if (viewerPreference === 'auto' && viewerEngine === 'google') {
      setViewerEngine('native');
      setFrameStatus('loading');
      return;
    }

    setFrameStatus('error');
  };

  useEffect(() => {
    if (frameStatus !== 'loading') return;

    const timeout = setTimeout(() => {
      setFrameStatus((status) => {
        if (status !== 'loading') return status;

        if (viewerPreference === 'auto' && viewerEngine === 'google') {
          setViewerEngine('native');
          return 'loading';
        }

        return 'error';
      });
    }, loadTimeoutMs);

    return () => clearTimeout(timeout);
  }, [frameStatus, loadTimeoutMs, viewerEngine, viewerPreference]);

  const iframeSrc =
    viewerEngine === 'google'
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
      : fileUrl;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl w-[95vw] max-h-[95vh] overflow-auto flex flex-col gap-0">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <DialogDescription className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1">
              <IGRPIcon iconName="User" className="text-primary" />
              {author}
            </div>
            <div className="flex items-center gap-1">
              <IGRPIcon iconName="Calendar" className="text-primary" />
              {safeFormatDate(date)}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 mt-4">
          <div
            className="w-full h-[60vh] bg-gray-100 rounded-lg overflow-hidden relative"
            aria-busy={frameStatus === 'loading'}
          >
            {frameStatus === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <IGRPLoadingSpinner />
              </div>
            )}

            {frameStatus === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 text-sm text-muted-foreground">
                <IGRPIcon iconName="AlertCircle" className="text-destructive" />
                <span>{loadErrorLabel}</span>
              </div>
            )}

            <iframe
              src={iframeSrc}
              className={cn('w-full h-full border-0', frameStatus === 'error' ? 'hidden' : 'block')}
              title={`PDF Viewer - ${title}`}
              aria-label={`PDF Viewer for ${title}`}
              loading="lazy"
              onLoad={handleFrameLoad}
              onError={handleFrameError}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <IGRPButton variant="default" onClick={() => onClose(false)}>
            {labelButtonCancel}
          </IGRPButton>
          <IGRPButton
            variant="secondary"
            onClick={() => openDocNewTab(fileUrl)}
            showIcon
            iconName="ExternalLink"
            aria-label={`${labelButtonNewTab} ${title}`}
          >
            {labelButtonNewTab}
          </IGRPButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { IGRPPdfViewer, type IGRPPdfViewerProps, type IGRPDocumentItem };
