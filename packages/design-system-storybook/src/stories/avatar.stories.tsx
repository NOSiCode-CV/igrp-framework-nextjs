import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPAvatar,
  type IGRPAvatarProps,
  IGRPIconObject
} from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';


const avatars = [
  { src: 'https://cdn-icons-png.flaticon.com/512/168/168726.png', fallback: 'A' },
  { src: 'https://cdn-icons-png.flaticon.com/512/168/168726.png', fallback: 'B' },
  { src: 'https://cdn-icons-png.flaticon.com/512/168/168726.png', fallback: 'C' },
  { src: 'https://cdn-icons-png.flaticon.com/512/168/168726.png', fallback: 'D' },
  { src: 'https://cdn-icons-png.flaticon.com/512/168/168726.png', fallback: 'E' },
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
    alt: {
      control: 'text',
      description: 'Alternative text for the avatar image',
    },
    size: {
      control: 'select',
      options: ['sm' , 'md' , 'lg' , 'xl'],
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
    iconName: {
      control: 'select',
      options: IGRPIconObject,
      description: 'Select an icon as Fallback',
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
    badgeVariant: {
      control: 'select',
      options: ['solid', 'outline', 'ghost'] ,
      description: 'Select Badge Color',
      defaultValue: 'solid',
    },
    badgeColor: {
      control: 'select',
      options: ['primary', 'success', 'destructive', 'warning', 'info', 'secondary', 'indigo'],
      description: 'Select Badge Color',
      defaultValue: 'primary',
    },
    badgeShowIcon: {
      control: 'boolean',
      description: 'Whether to show an icon',
    },
    badgeIconName: {
      control: 'select',
      options: IGRPIconObject,
      description: 'Select an icon',
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
    iconColor: {
      control: 'color' ,
      description: 'Select Badge Color',
    },
    fallbackClassName: {
      control: 'text',
      description: 'Fallback Class Name',
      defaultValue: 'False',
    },
    borderRadius: {
      control: 'select',
      description: 'Radius',
      options: ['rounded-none', 'rounded-sm', 'rounded', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-3xl', 'rounded-full'],
      defaultValue: 'rounded-none',
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
    src: 'https://cdn-icons-png.flaticon.com/512/168/168726.png',
    className: 'overflow-visible',
    fallback: 'Avatar Aang',
    iconName: 'Check',
    size: 'md',
    hasStatus:true,
    hasFallbackIcon:false,
    showIcon:true,    
    fallbackIcon:'User',
    iconClassName:'rounded-full',
    showBadge	:false,
    badgeColor:'destructive',
    iconColor:'#000000',
    badgeVariant:'solid',
    badgeNumber: 6,
    status:'success',
    borderRadius:'rounded-full'
  },
};

export const AvatarShape: StoryObj<IGRPAvatarProps> = {
  render: Template,
  args: {
    src: 'https://originui.com/avatar-80-04.jpg',
    fallback: 'AV',
    iconName: 'Check',
    status: 'success',
    borderRadius:'rounded-lg',
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
  },
};

export const Size: StoryObj<IGRPAvatarProps> = {
  render: Template,
  args: {
    src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6SGvshARHJ5GYSH_Kig8-cYNw5rO3nWn7mA&s',
    className: 'overflow-visible',
  },
};

export const HasIcon: StoryObj<IGRPAvatarProps> = {
  render: Template,
  args: {
    src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6SGvshARHJ5GYSH_Kig8-cYNw5rO3nWn7mA&s',
    showIcon: true,
    iconName: 'Check',
    className: 'overflow-visible',
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
    iconClassName:'rounded-full',
  },
};

//TODO doubt multiple avatar must be in the Default example
export const MultipleBadge: Story = {
  render: () => (
    <div className='flex -space-x-3'>
      {visibleAvatars.map((avatar, index) => (
        <IGRPAvatar
          key={index}
          src={avatar.src}
          iconName='Check'
          className='overflow-visible ring-background ring-2'
          fallback={avatar.fallback}
          hasStatus={false}
          status='primary'
          iconColor='primary'
          showIcon={false}
          iconSize={0}
          showBadge={false}
          badgeNumber={0}
          multiple={0}
          badgeColor={'destructive'}          
        />
      ))}
      {remaining > 0 && (
        <IGRPButtonPrimitive
          className='bg-secondary text-muted-foreground ring-background hover:bg-secondary hover:text-foreground flex size-10 items-center justify-center rounded-full text-md ring-2 ps-3'
          variant='ghost'
          size='icon'
        >
          +3
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
          fallback={avatar.fallback}
          hasStatus={false}
          status='primary'
          iconColor='primary'
          showIcon={false}
          iconSize={0}
          showBadge={false}
          badgeNumber={0}
          multiple={0}
          badgeColor={'destructive'}
        />
      ))}
      {remaining > 0 && (
        <p className='flex items-center justify-center mx-4'>Trusted by 60K+ developers.</p>
      )}
    </div>
  ),
};