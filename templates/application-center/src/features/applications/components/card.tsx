import { IGRPBadgePrimitive, IGRPIcon } from '@igrp/igrp-framework-react-design-system';
import {
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardFooterPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardTitlePrimitive,
  IGRPCardDescriptionPrimitive
} from '@igrp/igrp-framework-react-design-system';

import { ButtonTooltip } from '@/features/applications/components/button-tooltip';
import { Application } from '@/features/applications/types';
import { cn, statusClass } from '@/lib/utils';
import { formatSlug } from '../lib/utils';

// TODO: review the external badge colors, review icons
// TODO: Messages

export function ApplicationCard({ app }: { app: Application }) {
  const { name, code, status, description, slug, url } = app;
  const href = slug ? formatSlug(slug) : url;

  return (
    <IGRPCardPrimitive className='overflow-hidden card-hover gap-3 pt-4 pb-2 justify-between'>
      <IGRPCardHeaderPrimitive className='px-4 pb-0'>
        <div className='flex items-start justify-between'>
          <div className='flex items-start'>
            <div className='mr-2 rounded-md bg-primary/10 p-2'>
              <IGRPIcon iconName='AppWindow' className='text-primary' />
            </div>
            <div>
              <IGRPCardTitlePrimitive className='text-base line-clamp-2'>{name}</IGRPCardTitlePrimitive>
              <IGRPCardDescriptionPrimitive className='text-xs'>{code}</IGRPCardDescriptionPrimitive>
            </div>
          </div>
        </div>
      </IGRPCardHeaderPrimitive>
      <IGRPCardContentPrimitive className='px-4'>
        <p className='text-sm text-muted-foreground line-clamp-2 h-10'>
          {description || 'No description provided.'}
        </p>
      </IGRPCardContentPrimitive>
      <IGRPCardFooterPrimitive className='flex items-center justify-between px-4'>
        <div className='flex items-center'>
          <IGRPBadgePrimitive className={cn(statusClass(status), 'capitalize')}>
            {status.toLowerCase()}
          </IGRPBadgePrimitive>
        </div>
        <div className='flex items-center gap-1'>
          <ButtonTooltip
            href={`/applications/${code}`}
            icon='Eye'
            label='View'
          />
          <ButtonTooltip
            href={`/applications/${code}/edit`}
            icon='Edit'
            label='Edit'
          />
          <ButtonTooltip
            href={href || ''}
            icon='ExternalLink'
            label='Open'
          />
        </div>
      </IGRPCardFooterPrimitive>
    </IGRPCardPrimitive>
  );
}
