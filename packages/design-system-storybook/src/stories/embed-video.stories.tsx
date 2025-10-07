import { IGRPEmbedVideo,type IGRPEmbedVideoProps } from "@igrp/igrp-framework-react-design-system";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";


const meta: Meta<typeof IGRPEmbedVideo> = {
    title: 'Components/EmbedVideo',
    component: IGRPEmbedVideo,
    argTypes: {
      displayMode: {
        control: 'select',
        options: ['aspect-video' , 'aspect-square ' , 'aspect-auto','aspect-3/2'],
        description: 'display size',
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
    },
  };

export default meta;
type Story = StoryObj<typeof IGRPEmbedVideo>;

const Template = (args: IGRPEmbedVideoProps) => {
  return (
    <div className="p-3">
        <div className="sub">teste</div>
      <IGRPEmbedVideo {...args}>Open Alert Dialog</IGRPEmbedVideo>

    </div>
  );
};

export const Default: Story = {
  render: Template,
  args: {
    displayMode: 'aspect-video',
    src: 'https://www.youtube.com/watch?v=nbcj8C_FQEw',
    title: 'Embed Video',

  },
};
