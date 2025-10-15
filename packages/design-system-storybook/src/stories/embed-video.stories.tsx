import { IGRPEmbedVideo,type IGRPEmbedVideoProps } from "@igrp/igrp-framework-react-design-system";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";


const meta: Meta<typeof IGRPEmbedVideo> = {
    title: 'Components/EmbedVideo',
    component: IGRPEmbedVideo,
    argTypes: {
      displayMode: { control: 'select',
        options: ['1/1', '4/3', '16/9', '21/9','3/2', 'auto'],
        description: 'Image ratio',
        default: '16/9',
       },
      src: {
        control: 'text',
        description: 'Video Source',
        defaultValue: true,
      },
      title: {
        control: 'text',
        description: 'Video title',
        defaultValue: true,
      },
      loading: {
        control: 'select',
        description: 'Video title',
        options:['lazy','eager','auto'],
        defaultValue: 'auto',
      },
      allow: {
        control: 'check',
        description: 'Video title',
        options:['autoplay','clipboard-write', 'encrypted-media', 'gyroscope', 'picture-in-picture'],
        defaultValue: 'autoplay',
      },
      allowFullScreen: {
        control: 'select',
        description: 'Video title',
        options:[true,false],
        defaultValue: 'autoplay',
      },
      allowTransparency: {
        control: 'select',
        description: 'Video title',
        options:[true,false],
        defaultValue: 'autoplay',
      },
      autoplay: {
        control: 'select',
        description: 'Video title',
        options:[true,false],
        defaultValue: 'autoplay',
      },
      muted: {
        control: 'select',
        description: 'Video title',
        options:[true,false],
        defaultValue: 'autoplay',
      },
      controls: {
        control: 'select',
        description: 'Video title',
        options:[true,false],
        defaultValue: 'autoplay',
      },
      loop: {
        control: 'select',
        description: 'Video title',
        options:[true,false],
        defaultValue: 'autoplay',
      },
    },
  };

export default meta;
type Story = StoryObj<typeof IGRPEmbedVideo>;

const Template = (args: IGRPEmbedVideoProps) => {
  return (
    <div className="p-3">
      <IGRPEmbedVideo {...args}>Open Alert Dialog</IGRPEmbedVideo>

    </div>
  );
};

export const Default: Story = {
  render: Template,
  args: {
    displayMode: '16/9',
    src: 'https://www.youtube.com/embed/FbT5E8DdxTQ?si=wrXPTY1Q8Sq2_fNm',
    title: 'Embed Video',
    loading: 'lazy',
    allow: 'autoplay encrypted-media', //TODO not working as espected
    allowFullScreen: true,
    allowTransparency: true,
    autoplay:true,
    muted:true,
    loop:true,
    controls:true

  },
};

export const NoAutoPlay: Story = {
  render: Template,
  args: {
    displayMode: '1/1',
    src: 'https://www.youtube.com/embed/FbT5E8DdxTQ?si=wrXPTY1Q8Sq2_fNm',
    title: 'Embed Video',
    loading: 'lazy',
    allow: 'autoplay encrypted-media', //TODO not working as espected
    allowFullScreen: false,
    allowTransparency: true,
    autoplay:false,
    muted:true,
    loop:true,
    controls:true

  },
};
export const Muted: Story = {
  render: Template,
  args: {
    displayMode: '1/1',
    src: 'https://www.youtube.com/embed/FbT5E8DdxTQ?si=wrXPTY1Q8Sq2_fNm',
    title: 'Embed Video',
    loading: 'lazy',
    allow: 'autoplay encrypted-media', //TODO not working as espected
    allowFullScreen: false,
    allowTransparency: true,
    autoplay:false,
    muted:true,
    loop:true,
    controls:true

  },
};
export const AllowFullScreen: Story = {
  render: Template,
  args: {
    displayMode: '1/1',
    src: 'https://www.youtube.com/embed/FbT5E8DdxTQ?si=wrXPTY1Q8Sq2_fNm',
    title: 'Embed Video',
    loading: 'lazy',
    allow: 'autoplay encrypted-media', //TODO not working as espected
    allowFullScreen: true,
    allowTransparency: true,
    autoplay:true,
    muted:true,
    loop:true,
    controls:true

  },
};
export const NoControls: Story = {
  render: Template,
  args: {
    displayMode: '1/1',
    src: 'https://www.youtube.com/embed/FbT5E8DdxTQ?si=wrXPTY1Q8Sq2_fNm',
    title: 'Embed Video',
    loading: 'lazy',
    allow: 'autoplay encrypted-media', //TODO not working as espected
    allowFullScreen: false,
    autoplay:false,
    muted:true,
    loop:true,
    controls:false

  },
};