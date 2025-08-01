import type { Meta, StoryFn, StoryObj } from '@storybook/react-vite';
import { IGRPButton, IGRPToaster, useIGRPToast } from '@igrp/igrp-framework-react-design-system';

export default {
  title: 'Components/Toaster',
  component: () => null,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

const Template: StoryFn = () => {
  const { igrpToast } = useIGRPToast();

  return (
    <>
      <IGRPToaster richColors />

      <div className='flex flex-col gap-5 space-y-3 p-4'>
        <IGRPButton onClick={() => igrpToast({ title: 'Default Toast' })}>Default</IGRPButton>

        <IGRPButton
          onClick={() =>
            igrpToast({
              type: 'info',
              title: 'Info!',
              description: <span className='text-foreground'>'This is a info message.'</span>,
              action: {
                label: 'Undo',
                onClick: () => console.log('Undo'),
              },
            })
          }
        >
          Info
        </IGRPButton>

        <IGRPButton
          onClick={() =>
            igrpToast({
              type: 'success',
              title: 'Success!',
              description: 'This is a success message.',
            })
          }
        >
          Success
        </IGRPButton>
        <IGRPButton
          onClick={() =>
            igrpToast({
              type: 'error',
              title: 'Error!',
              description: 'Something went wrong.',
            })
          }
        >
          Error
        </IGRPButton>
        <IGRPButton
          onClick={() =>
            igrpToast({
              type: 'warning',
              title: 'Warning!',
              description: 'Be careful!',
            })
          }
        >
          Warning
        </IGRPButton>
        <IGRPButton
          onClick={() =>
            igrpToast({
              content: <div className='p-4 bg-blue-500 text-white rounded-lg'>🚀 Custom Toast</div>,
            })
          }
        >
          Custom JSX
        </IGRPButton>
        <IGRPButton
          onClick={() =>
            igrpToast({
              promise: new Promise((resolve) => setTimeout(resolve, 2000)),
              loading: 'Loading...',
              success: 'Loaded!',
              error: 'Failed!',
            })
          }
        >
          Promise Toast
        </IGRPButton>
      </div>
    </>
  );
};

export const ToasterStory: StoryObj = {
  render: Template,
};
