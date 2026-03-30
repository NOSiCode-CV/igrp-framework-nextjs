import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPModalDialog,
  IGRPModalDialogTrigger,
  IGRPModalDialogContent,
  IGRPModalDialogHeader,
  IGRPModalDialogTitle,
  IGRPModalDialogDescription,
  IGRPModalDialogFooter,
  IGRPModalDialogClose,
  type IGRPModalDialogContentProps,
  Button,
  Input,
  Label,
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPModalDialogContent> = {
  title: 'Components/ModalDialog',
  component: IGRPModalDialogContent,

  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Controls the size of the modal content area.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof IGRPModalDialogContent>;

const renderModalContent = (
  args: {
    title?: string;
    description?: string;
    bodyContent?: React.ReactNode;
    footerContent?: React.ReactNode;
    stickyHeader?: boolean;
    stickyFooter?: boolean;
  } & IGRPModalDialogContentProps,
) => (
  <div className='container mx-auto p-10 flex items-center justify-center'>
    <IGRPModalDialog>
      <IGRPModalDialogTrigger asChild>
        <Button>Open Modal</Button>
      </IGRPModalDialogTrigger>
      <IGRPModalDialogContent size={args.size}>
        <IGRPModalDialogHeader stickyHeader={args.stickyHeader}>
          <IGRPModalDialogTitle>{args.title || 'Modal Title'}</IGRPModalDialogTitle>
          {args.description && (
            <IGRPModalDialogDescription>{args.description}</IGRPModalDialogDescription>
          )}
        </IGRPModalDialogHeader>
        {args.bodyContent || (
          <div>
            <p>
              This is the default body content. You can replace this with any React node. This is
              the default body content. You can replace this with any React node.
            </p>
            {Array.from({ length: 10 }).map((_, i) => (
              <p
                key={i}
                className='py-2 border-b last:border-b-0'
              >
                Scrollable content item {i + 1}
              </p>
            ))}
          </div>
        )}
        <IGRPModalDialogFooter stickyFooter={args.stickyFooter}>
          {args.footerContent || (
            <>
              <Button variant='outline'>Cancel</Button>
              <IGRPModalDialogClose asChild>
                <Button>Save Changes</Button>
              </IGRPModalDialogClose>
            </>
          )}
        </IGRPModalDialogFooter>
      </IGRPModalDialogContent>
    </IGRPModalDialog>
  </div>
);

export const Default: Story = {
  render: () =>
    renderModalContent({
      title: 'Default Modal (LG)',
      description: 'This is a standard modal dialog.',
      size: 'lg',
    }),
};

export const Small: Story = {
  render: () =>
    renderModalContent({
      title: 'Small Modal (SM)',
      description: 'A compact modal dialog.',
      bodyContent: <p>Minimal content for a small modal.</p>,
      size: 'sm',
    }),
};

export const ExtraLargeWithStickyHeader: Story = {
  render: () =>
    renderModalContent({
      title: 'Extra Large Modal (XL) - Sticky Header',
      description: 'This modal has a sticky header. Scroll down to see it in action.',
      stickyHeader: true,
      bodyContent: (
        <>
          {Array.from({ length: 30 }).map((_, i) => (
            <p
              key={i}
              className='py-3 border-b last:border-b-0'
            >
              Very long scrollable content item {i + 1} to demonstrate sticky header.
            </p>
          ))}
        </>
      ),
      size: 'xl',
    }),
};

export const FullSizeWithStickyFooter: Story = {
  render: () =>
    renderModalContent({
      size: 'full',
      title: 'Full Size Modal - Sticky Footer',
      description: 'This modal takes up most of the screen and has a sticky footer.',
      stickyFooter: true,
      bodyContent: (
        <>
          {Array.from({ length: 50 }).map((_, i) => (
            <p
              key={i}
              className='py-3 border-b last:border-b-0'
            >
              Extensive content item {i + 1} for the full-size modal. Extensive content item {i + 1}{' '}
              for the full-size modal. Extensive content item {i + 1} for the full-size modal.
            </p>
          ))}
        </>
      ),
    }),
};

export const WithStickyHeaderAndFooter: Story = {
  render: () =>
    renderModalContent({
      size: 'lg',
      title: 'Modal with Sticky Header & Footer',
      description: 'Both header and footer remain visible while scrolling.',
      stickyHeader: true,
      stickyFooter: true,
      bodyContent: (
        <>
          {Array.from({ length: 40 }).map((_, i) => (
            <p
              key={i}
              className='py-3 border-b last:border-b-0'
            >
              Scrollable content item {i + 1}.
            </p>
          ))}
        </>
      ),
    }),
};

export const WithFormContent: Story = {
  render: () =>
    renderModalContent({
      size: 'md',
      title: 'Edit Profile',
      description: "Make changes to your profile here. Click save when you're done.",
      stickyHeader: true, // Forms often benefit from sticky headers/footers
      stickyFooter: true,
      bodyContent: (
        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label
              htmlFor='name'
              className='text-right'
            >
              Name
            </Label>
            <Input
              id='name'
              defaultValue='John Doe'
              className='col-span-3'
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label
              htmlFor='username'
              className='text-right'
            >
              Username
            </Label>
            <Input
              id='username'
              defaultValue='@johndoe'
              className='col-span-3'
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label
              htmlFor='email'
              className='text-right'
            >
              Email
            </Label>
            <Input
              id='email'
              type='email'
              defaultValue='john.doe@example.com'
              className='col-span-3'
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label
              htmlFor='bio'
              className='text-right self-start pt-2'
            >
              Bio
            </Label>
            <textarea
              id='bio'
              defaultValue='Loves coding and building awesome things with Next.js and Tailwind CSS.'
              className='col-span-3 p-2 border rounded-md min-h-[80px] bg-background'
            />
          </div>
        </div>
      ),
      footerContent: (
        <>
          <IGRPModalDialogClose asChild>
            <Button variant='outline'>Cancel</Button>
          </IGRPModalDialogClose>
          <IGRPModalDialogClose asChild>
            <Button
              onClick={() => {
                console.log('Form submitted (simulated)');
                // alert("Form submitted (simulated)") // You can use alert for quick feedback in Storybook
              }}
            >
              Save Profile
            </Button>
          </IGRPModalDialogClose>
        </>
      ),
    }),
};

export const WithOutsideButton: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div className='container mx-auto p-10 flex flex-col items-center justify-center gap-4'>
        <Button onClick={() => setOpen(true)}>
          Open Modal from Outside Button
        </Button>
        <IGRPModalDialog open={open} onOpenChange={setOpen}>
          <IGRPModalDialogContent size='md'>
            <IGRPModalDialogHeader>
              <IGRPModalDialogTitle>Modal Controlled by Outside Button</IGRPModalDialogTitle>
              <IGRPModalDialogDescription>
                This modal is opened and controlled by a button that is outside the modal dialog
                component structure.
              </IGRPModalDialogDescription>
            </IGRPModalDialogHeader>
            <div>
              <p>
                The modal state is managed using React state, allowing you to control it from
                anywhere in your component tree.
              </p>
              <p className='mt-4'>
                This pattern is useful when you need to trigger a modal from a button that's not
                directly nested within the modal component.
              </p>
            </div>
            <IGRPModalDialogFooter>
              <Button variant='outline' onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <IGRPModalDialogClose asChild>
                <Button>Confirm</Button>
              </IGRPModalDialogClose>
            </IGRPModalDialogFooter>
          </IGRPModalDialogContent>
        </IGRPModalDialog>
      </div>
    );
  },
};
