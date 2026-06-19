import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { IGRPBanner } from '@igrp/igrp-framework-react-design-system';

const meta = {
  title: 'Components/Banner',
  component: IGRPBanner,
  argTypes: {
    variant: {
      control: 'select',
      options: ['cookie', 'announcement'],
      description: 'Banner style: bottom-fixed cookie consent or top announcement bar.',
    },
    message: { control: 'text' },
    learnMoreHref: { control: 'text' },
    learnMoreLabel: { control: 'text' },
    acceptLabel: { control: 'text' },
    declineLabel: { control: 'text' },
    className: { control: 'text' },
  },
  args: {
    onAccept: fn(),
    onDecline: fn(),
    onDismiss: fn(),
  },
} satisfies Meta<typeof IGRPBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Cookie-consent variant. Pinned to the bottom of the viewport with accept / decline actions. */
export const Cookie: Story = {
  args: {
    variant: 'cookie',
    message: 'We use cookies to improve your experience. By continuing, you accept our cookie policy.',
    acceptLabel: 'Accept',
    declineLabel: 'Decline',
  },
};

/** Announcement variant. A primary-coloured top bar with an optional "learn more" link and dismiss button. */
export const Announcement: Story = {
  args: {
    variant: 'announcement',
    message: '🎉 IGRP 3 is now available with a refreshed design system.',
    learnMoreHref: 'https://nosi.cv',
    learnMoreLabel: 'Learn more',
  },
};

/** Announcement without a link — just a message and a dismiss button. */
export const AnnouncementNoLink: Story = {
  args: {
    variant: 'announcement',
    message: 'Scheduled maintenance this weekend. Some services may be unavailable.',
  },
};

/** Cookie banner with localized (pt-PT) labels via the overridable props. */
export const CookieLocalized: Story = {
  args: {
    variant: 'cookie',
    message: 'Utilizamos cookies para melhorar a sua experiência.',
    acceptLabel: 'Aceitar',
    declineLabel: 'Recusar',
  },
};
