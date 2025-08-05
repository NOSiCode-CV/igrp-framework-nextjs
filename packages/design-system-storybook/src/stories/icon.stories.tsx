import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPIcon,
  type IGRPIconProps,
  IGRPIconObject,
  IGRPAlertDialogPrimitive,
  IGRPAlertDialogContentPrimitive,
  IGRPAlertDialogHeaderPrimitive,
  IGRPButtonPrimitive,
  IGRPInputPrimitive,
  IGRPSeparatorPrimitive,
  IGRPTooltipProviderPrimitive,
  IGRPTooltipPrimitive,
  IGRPTooltipContentPrimitive,
  IGRPTooltipTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';

import { dependencies } from '@igrp/igrp-framework-react-design-system/package.json';

const meta: Meta<IGRPIconProps> = {
  title: 'Components/Icons',
  component: IGRPIcon,
};

export default meta;

function IconGalleryComponent() {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [loadingIcon, setLoadingIcon] = useState<string | null>(null);
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [search, setSearch] = useState('');

  const iconsList = useMemo(() => IGRPIconObject, []);
  const filteredIcons = useMemo(() => {
    return iconsList.filter((icon) => icon.toLowerCase().includes(search.toLowerCase()));
  }, [iconsList, search]);

  const handleCopy = useCallback(async (iconName: string) => {
    try {
      await navigator.clipboard.writeText(iconName);
      setCopied(true);
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const handleOpenIcon = (iconName: string) => {
    if (selectedIcon === iconName || loadingIcon) return;
    setLoadingIcon(iconName);

    setTimeout(() => {
      setSelectedIcon(iconName);
      setOpenDialogs((prev) => ({ ...prev, [iconName]: true }));
      setLoadingIcon(null);
    }, 300);
  };

  const highlightMatch = (name: string, query: string) => {
    if (!query) return name;
    const parts = name.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span
          key={index}
          className='bg-yellow-200 dark:bg-yellow-400/20'
        >
          {part}
        </span>
      ) : (
        <span key={index}>{part}</span>
      ),
    );
  };

  useEffect(() => {
    return () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
    };
  }, []);

  return (
    <IGRPTooltipProviderPrimitive>
      <div className='p-8 space-y-4'>
        <div className='flex gap-8 items-center'>
          <h3 className='font-semibold text-xl'>
            Browse for Lucide Icons version {dependencies['lucide-react']}
          </h3>
          <div className='relative flex-1'>
            <IGRPIcon
              iconName='Search'
              className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500'
              aria-hidden='true'
            />
            <IGRPInputPrimitive
              type='text'
              placeholder='Search icons...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-10 pr-10'
              aria-label='Search icons'
            />
            {search && (
              <IGRPButtonPrimitive
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none hover:bg-transparent cursor-pointer'
                onClick={() => setSearch('')}
                aria-label='Clear search'
                variant='ghost'
                size='icon'
              >
                <IGRPIcon
                  iconName='X'
                  className='w-5 h-5'
                  aria-hidden='true'
                />
              </IGRPButtonPrimitive>
            )}
          </div>
        </div>

        <div className='text-sm text-muted-foreground'>
          Showing {filteredIcons.length} of {iconsList.length} icons
        </div>

        <IGRPSeparatorPrimitive className='my-6' />

        <div className='grid grid-cols-[repeat(auto-fill,_minmax(56px,_1fr))] gap-4 w-full'>
          {filteredIcons.length > 0 ? (
            filteredIcons.map((iconName) => (
              <IGRPAlertDialogPrimitive
                key={iconName}
                open={openDialogs[iconName] || false}
                onOpenChange={(open) => {
                  if (!open) {
                    setOpenDialogs((prev) => ({ ...prev, [iconName]: false }));
                    setSelectedIcon(null);
                  }
                }}
              >
                <IGRPTooltipPrimitive>
                  <IGRPTooltipTriggerPrimitive asChild>
                    <IGRPButtonPrimitive
                      aria-label={`View details for ${iconName}`}
                      variant='ghost'
                      size='icon'
                      onClick={() => handleOpenIcon(iconName)}
                      disabled={loadingIcon === iconName}
                      className="flex justify-center items-center p-0 mx-auto h-14 w-14 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer [&_svg:not([class*='size-'])]:size-6"
                    >
                      {loadingIcon === iconName ? (
                        <IGRPIcon
                          iconName='Loader'
                          className='w-5 h-5 animate-spin'
                        />
                      ) : (
                        <IGRPIcon
                          iconName={iconName}
                          size='24'
                        />
                      )}
                      <span className='sr-only'>{iconName}</span>
                    </IGRPButtonPrimitive>
                  </IGRPTooltipTriggerPrimitive>
                  {selectedIcon !== iconName && loadingIcon !== iconName && (
                    <IGRPTooltipContentPrimitive>{iconName}</IGRPTooltipContentPrimitive>
                  )}
                </IGRPTooltipPrimitive>

                {selectedIcon === iconName && (
                  <IGRPAlertDialogContentPrimitive className='p-4'>
                    <IGRPAlertDialogHeaderPrimitive className='flex justify-between items-center relative'>
                      <IGRPButtonPrimitive
                        size='icon'
                        variant='ghost'
                        onClick={() => setSelectedIcon(null)}
                        aria-label='Close'
                        className='absolute -top-1 -right-1 cursor-pointer'
                      >
                        <IGRPIcon
                          iconName='X'
                          className='w-5 h-5'
                          aria-hidden='true'
                        />
                      </IGRPButtonPrimitive>
                    </IGRPAlertDialogHeaderPrimitive>

                    <div className='flex gap-8 mt-3'>
                      <IGRPIcon
                        iconName={selectedIcon}
                        size='80'
                      />

                      <div className='flex gap-2 items-center'>
                        <h3 className='flex flex-wrap text-xl font-semibold'>
                          {highlightMatch(selectedIcon, search)}
                        </h3>
                        <IGRPButtonPrimitive
                          variant='outline'
                          onClick={() => handleCopy(selectedIcon)}
                          aria-label='Copy icon name'
                          className='cursor-pointer'
                        >
                          {copied ? (
                            <IGRPIcon
                              iconName='Check'
                              className='w-4 h-4 mr-1'
                            />
                          ) : (
                            <IGRPIcon
                              iconName='Copy'
                              className='w-4 h-4 mr-1'
                            />
                          )}
                        </IGRPButtonPrimitive>
                      </div>
                    </div>
                  </IGRPAlertDialogContentPrimitive>
                )}
              </IGRPAlertDialogPrimitive>
            ))
          ) : (
            <p className='col-span-6 text-center text-gray-500'>No icons found</p>
          )}
        </div>
      </div>
    </IGRPTooltipProviderPrimitive>
  );
}

export const IconGallery: StoryObj<IGRPIconProps> = {
  render: IconGalleryComponent,
  args: {
    size: 24,
    color: 'black',
  },
};
