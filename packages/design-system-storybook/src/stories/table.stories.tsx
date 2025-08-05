import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPTable,
  type IGRPTableProps,
  IGRPButtonPrimitive,
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPTable> = {
  title: 'Components/Table',
  component: IGRPTable,
  argTypes: {
    content: { control: 'object' },
    columns: { control: 'object' },
    // actions: { control: 'object' },
    isStriped: { control: 'boolean' },
    isHeaderSticky: { control: 'boolean' },
    tableClass: { control: 'text' },
    tHeadClass: { control: 'text' },
    tBodyClass: { control: 'text' },
    tFootClass: { control: 'text' },
    tHeadRowClass: { control: 'text' },
    tBodyRowClass: { control: 'text' },
    tFootRowClass: { control: 'text' },
    showFooter: { control: 'boolean' },
    footerContent: { control: 'text' },
    footerColumn: { control: 'text' },
  },
};

export default meta;

// TODO
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Template: StoryFn<IGRPTableProps<any>> = (args) => (
  <div className='container mx-auto my-10 p-4 min-h-screen'>
    <IGRPTable {...args} />
  </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Default: StoryObj<IGRPTableProps<any>> = {
  render: Template,
  args: {
    content: [
      { id: 1, name: 'John Doe', age: 28 },
      { id: 2, name: 'Jane Smith', age: 34 },
      { id: 3, name: 'Sam Johnson', age: 22 },
    ],
    columns: [
      { header: 'ID', accessorKey: 'id' },
      { header: 'Name', accessorKey: 'name' },
      { header: 'Age', accessorKey: 'age' },
    ],
    actions: ({ original }) => (
      <IGRPButtonPrimitive
        variant='outline'
        size='sm'
      >
        Edit {original.name}
      </IGRPButtonPrimitive>
    ),
  },
};
