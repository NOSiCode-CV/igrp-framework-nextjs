import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPAvatar,
  type IGRPAvatarProps,
  IGRPIconObject,
} from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';

const avatars = [
  { src: 'https://originui.com/avatar-80-04.jpg', fallback: 'A' },
  { src: 'https://originui.com/avatar-80-05.jpg', fallback: 'B' },
  { src: 'https://originui.com/avatar-80-06.jpg', fallback: 'C' },
  { src: 'https://originui.com/avatar-80-07.jpg', fallback: 'D' },
  { src: 'https://originui.com/avatar-80-08.jpg', fallback: 'E' },
];

const maxVisible = 4;
const visibleAvatars = avatars.slice(0, maxVisible);
const remaining = avatars.length - maxVisible;

type Story = StoryObj<typeof IGRPAvatar>;


export default {
  title: 'Components/Avatar',
  component: IGRPAvatar,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    src: {
      control: 'text',
      description: 'Specifies the path to the image file',
    },
    size: {
      control: 'number',
      description: 'Avatar size',
    },
    fallback: {
      control: 'text',
      description: 'Simplified version of a user`s primary avatar when it cannot be shown ',
    },
    hasStatus: {
      control: 'boolean',
      options: [true, false],
      description: 'Avatar has State',
      defaultValue: 'False',
    },
    status: {
      control: 'select',
      description: 'Avatar current state',
      options: ['primary', 'success', 'destructive', 'warning', 'info', 'secondary', 'indigo'],
    },
    showIcon: {
      control: 'boolean',
      options: [true, false],
      description: 'If Avatar has Icon',
      defaultValue: 'False',
    },
    className: {
      control: 'text',
      description: 'If Avatar has Icon',
    },
    imageClassName: { 
      control: 'text',
      description: 'Image class' 
    },
    iconName: {
      control: 'select',
      options: IGRPIconObject,
      description: 'Select an icon',
      defaultValue: 'Check',
    },
    iconClassName: { 
      control: 'text',
      description: 'Icon class' 
     },
    showBadge: { control: 'boolean',
      description: 'If has Badge' 
     },
    badgeNumber: { 
      control: 'number',
      description: 'Number inside the Badge' 
     },
    fallbackIcon: {
      control: 'select',
      options: IGRPIconObject,
      description: 'Select an icon as Fallback',
      defaultValue: 'User',
    },
    hasFallbackIcon: {
      control: 'boolean',
      options: [true, false],
      description: 'If Avatar has Icon',
      defaultValue: 'False',
    },
  },
} as Meta;

const Template: StoryFn<IGRPAvatarProps> = (args) => (
  <div className='container my-10 mx-auto p-4 border rounded-lg shadow-sm'>
    <IGRPAvatar {...args} />
  </div>
);

export const Default: StoryObj<IGRPAvatarProps> = {
  render: Template,
  args: {
    src: 'https://originui.com/avatar-80-04.jpg',
    fallback: 'Avatar Aang',
    iconName: 'Check',
    size: 30,
    hasStatus:false,
    hasFallbackIcon:false,
    showIcon:false,
    showBadge	:false,
    status:'success',
    imageClassName:'rounded-full',
    iconClassName:'rounded-full',
    className: 'overflow-visible',
    badgeNumber: 6,
    fallbackIcon:'User'
  },
};

export const AvatarShape: StoryObj<IGRPAvatarProps> = {
  render: Template,
  args: {
    src: 'https://originui.com/avatar-80-04.jpg',
    fallback: 'AV',
    imageClassName: 'rounded-md',
    iconName: 'Check',
    status: 'success',
  },
};

export const FallBackText: StoryObj<IGRPAvatarProps> = {
  render: Template,
  args: {
    fallback: 'AVasas',
  },
};

export const FallBackIcon: StoryObj<IGRPAvatarProps> = {
  render: Template,
  args: {
    hasFallbackIcon: true,
    fallbackIcon: 'User',
  },
};

export const Status: StoryObj<IGRPAvatarProps> = {
  render: Template,
  args: {
    src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6SGvshARHJ5GYSH_Kig8-cYNw5rO3nWn7mA&s',
    hasStatus: true,
    status: 'success',
    className: 'overflow-visible',
    imageClassName: 'rounded-full',
  },
};

export const Size: StoryObj<IGRPAvatarProps> = {
  render: Template,
  args: {
    src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6SGvshARHJ5GYSH_Kig8-cYNw5rO3nWn7mA&s',
    className: 'overflow-visible',
    imageClassName: 'rounded-full',
    size: 120,
  },
};

export const HasIcon: StoryObj<IGRPAvatarProps> = {
  render: Template,
  args: {
    src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6SGvshARHJ5GYSH_Kig8-cYNw5rO3nWn7mA&s',
    showIcon: true,
    iconName: 'Check',
    className: 'overflow-visible',
    imageClassName:'rounded-full',
    iconClassName:'rounded-full',
  },
};

export const HasBadge: StoryObj<IGRPAvatarProps> = {
  render: Template,
  args: {
    src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6SGvshARHJ5GYSH_Kig8-cYNw5rO3nWn7mA&s',
    showBadge: true,
    iconName: 'Check',
    className: 'overflow-visible',
    badgeNumber: 6,
    imageClassName:'rounded-full',
    iconClassName:'rounded-full',
  },
};

//TODO doutght multiple avatar must be in the Default example
export const MultipleBadge: Story = {
  render: () => (
    <div className='flex -space-x-3'>
      {visibleAvatars.map((avatar, index) => (
        <IGRPAvatar
          key={index}
          src={avatar.src}
          iconName='Check'
          className='overflow-visible ring-background ring-2'
          imageClassName='rounded-full'
          fallback={avatar.fallback}
          hasStatus={false}
          status='primary'
          showIcon={false}
          iconSize={0}
          showBadge={false}
          badgeNumber={0}
          multiple={0}
        />
      ))}
      {remaining > 0 && (
        <IGRPButtonPrimitive
          className='bg-secondary text-muted-foreground ring-background hover:bg-secondary hover:text-foreground flex size-10 items-center justify-center rounded-full text-xs ring-2'
          size='icon'
        >
          +3s
        </IGRPButtonPrimitive>
      )}
    </div>
  ),
};

export const MultipleBadgeWithText: Story = {
  render: () => (
    <div className='flex -space-x-3 rounded-full border bg-gray-100'>
      {visibleAvatars.map((avatar, index) => (
        <IGRPAvatar
          key={index}
          src={avatar.src}
          iconName='Check'
          className='overflow-visible ring-background ring-2'
          imageClassName='rounded-full'
          fallback={avatar.fallback}
          hasStatus={false}
          status='primary'
          showIcon={false}
          iconSize={0}
          showBadge={false}
          badgeNumber={0}
          multiple={0}
        />
      ))}
      {remaining > 0 && (
        <p className='flex items-center justify-center px-3'>Trusted by 60K+ developers.</p>
      )}
    </div>
  ),
};

// export const MultipleBadge2: Story = {

//   render: (args) => (
//       <div className='flex -space-x-3'>
//        <IGRPAvatar
//             src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6SGvshARHJ5GYSH_Kig8-cYNw5rO3nWn7mA&s'
//             iconName='Check'
//             className='overflow-visible ring-background rounded-full ring-1'
//             imageClassName='rounded-full'
//             fallback=''
//             hasStatus={false}
//             status={'primary'}
//             showIcon={false}
//             iconSize={0}
//             showBadge={false}
//             badgeNumber={args.badgeNumber}

//           />
//           <IGRPAvatar
//             src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6SGvshARHJ5GYSH_Kig8-cYNw5rO3nWn7mA&s'
//             iconName='Check'
//             className='overflow-visible ring-background rounded-full ring-1'
//             imageClassName='rounded-full'
//             hasStatus={false}
//             status={'primary'}
//             showIcon={false}
//             iconSize={0}
//             showBadge={false}
//             badgeNumber={0}

//           />
//           <IGRPAvatar
//             src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6SGvshARHJ5GYSH_Kig8-cYNw5rO3nWn7mA&s'
//             iconName='Check'
//             className='overflow-visible ring-background rounded-full ring-1'
//             imageClassName='rounded-full'
//             hasStatus={false}
//             status={'primary'}
//             showIcon={false}
//             iconSize={0}
//             showBadge={false}
//             badgeNumber={0}
//             multiple={0}
//           />
//             <IGRPButtonPrimitive
//         variant='secondary'
//         className='bg-secondary text-muted-foreground ring-background hover:bg-secondary hover:text-foreground flex size-10 items-center justify-center rounded-full text-xs ring-2'
//         size='icon'
//       >
//         {remaining}
//       </IGRPButtonPrimitive>
//       </div>
//   ),

// };
