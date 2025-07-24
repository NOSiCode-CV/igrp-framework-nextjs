'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle } from '@/components/horizon/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/horizon/dialog';
import { IGRPBadge } from '@/components/igrp/badge';
import { IGRPButton } from '@/components/igrp/button';
import { IGRPIcon } from '@/components/igrp/icon';
import { IGRPLoadingSpinner } from '@/components/igrp/loading';
import { IGRPHeadline, IGRPText } from '@/components/igrp/typography';
import { IGRPColors } from '@/lib/colors';

type IGRPDocumentItem = {
  id: number;
  title: string;
  description: string;
  author: string;
  date: string;
  fileUrl: string;
};

interface IGRPPdfViewerProps {
  document: IGRPDocumentItem;
  displayMode?: 'modal' | 'inline';
  labelButtonCancel?: string;
  labelButtonNewTab?: string;
  inlineHeight?: string;
  notFoundLabel?: string;
  name?: string;
}

function IGRPPdfViewer({
  document,
  displayMode = 'modal',
  labelButtonCancel = 'Close',
  labelButtonNewTab = 'Open in new tab',
  inlineHeight = '50vh',
  notFoundLabel = 'No File found',
  name,
}: IGRPPdfViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState<IGRPDocumentItem>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
      <div
        className='flex items-center gap-3'
        id={name}
      >
        <IGRPIcon
          iconName='FileX2'
          className={IGRPColors.solid.destructive.text}
        />
        <IGRPText
          as='p'
          size='default'
          weight='semibold'
          spacing='none'
        >
          {notFoundLabel}
        </IGRPText>
      </div>
    );
  }

  return (
    <div className='flex flex-col'>
      {displayMode === 'inline' && (
        <IGRPPdfViewerInline
          document={document}
          labelButtonNewTab={labelButtonNewTab}
          height={inlineHeight}
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
  return (
    <Card
      key={document.id}
      className={`transition-all py-3 ${clickable ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={clickable ? () => onView(document) : undefined}
    >
      <CardHeader className='gap-0'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-2'>
            <IGRPIcon
              iconName='FileText'
              className='text-muted-foreground'
            />
            <CardTitle className='text-sm font-medium leading-tight'>{document.title}</CardTitle>
          </div>
          <IGRPBadge
            variant='soft'
            color='destructive'
            badgeClassName='px-3'
          >
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
};

function IGRPPdfViewerInline({
  document,
  labelButtonNewTab = 'Open in new tab',
  height = '50vh',
}: IGRPPdfViewerInlineProps) {
  const { fileUrl, title, author, date } = document;
  const iframeSrc = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

  const openDocNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-col'>
        <div className='flex items-center justify-between'>
          <div>
            <IGRPHeadline
              variant='h6'
              title={title}
            />
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <div className='flex items-center gap-1 text-xs'>
                <IGRPIcon
                  iconName='User'
                  className='text-primary'
                />
                {author}
              </div>
              <div className='flex items-center gap-1 text-xs'>
                <IGRPIcon
                  iconName='Calendar'
                  className='text-primary'
                />
                {format(new Date(date), 'dd/MM/yyyy')}
              </div>
            </div>
          </div>

          <IGRPButton
            variant='default'
            onClick={openDocNewTab}
            showIcon
            iconName='ExternalLink'
            size='sm'
          >
            {labelButtonNewTab}
          </IGRPButton>
        </div>
      </div>

      <div className={`w-full bg-gray-100 rounded-lg overflow-hidden h-[${height}]`}>
        <iframe
          src={iframeSrc}
          className='w-full h-full border-0'
          title={`PDF Viewer - ${title}`}
          aria-label={`PDF Viewer for ${title}`}
          loading='lazy'
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
};

function IGRPPdfViewerModal({
  open,
  document,
  onClose,
  labelButtonCancel,
  labelButtonNewTab,
}: IGRPPdfViewerModalProps) {
  if (!document) return null;

  const { fileUrl, title, author, date } = document;
  const iframeSrc = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

  const openDocNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
    >
      <DialogContent className='sm:max-w-6xl w-[95vw] max-h-[95vh] overflow-auto flex flex-col gap-0'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold'>{title}</DialogTitle>
          <DialogDescription className='flex items-center gap-4 mt-1'>
            <div className='flex items-center gap-1'>
              <IGRPIcon
                iconName='User'
                className='text-primary'
              />
              {author}
            </div>
            <div className='flex items-center gap-1'>
              <IGRPIcon
                iconName='Calendar'
                className='text-primary'
              />
              {format(new Date(date), 'dd/MM/yyyy')}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 mt-4'>
          <div className='w-full h-[60vh] bg-gray-100 rounded-lg overflow-hidden'>
            <iframe
              src={iframeSrc}
              className='w-full h-full border-0'
              title={`PDF Viewer - ${title}`}
              aria-label={`PDF Viewer for ${title}`}
              loading='lazy'
            />
          </div>
        </div>

        <DialogFooter className='mt-4'>
          <IGRPButton
            variant='default'
            onClick={() => onClose(false)}
          >
            {labelButtonCancel}
          </IGRPButton>
          <IGRPButton
            variant='secondary'
            onClick={openDocNewTab}
            showIcon
            iconName='ExternalLink'
          >
            {labelButtonNewTab}
          </IGRPButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { IGRPPdfViewer, type IGRPPdfViewerProps, type IGRPDocumentItem };
