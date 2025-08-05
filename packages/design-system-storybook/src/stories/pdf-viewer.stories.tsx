import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { IGRPPdfViewer, type IGRPDocumentItem } from '@igrp/igrp-framework-react-design-system';

const sampleDocument: IGRPDocumentItem = {
  id: 1,
  title: 'FOS',
  description: 'Declaração anexada',
  author: '',
  date: '2025-02-01',
  fileUrl: 'https://assets.accessible-digital-documents.com/uploads/2017/01/sample-tables.pdf',
};

const longTitleDocument: IGRPDocumentItem = {
  id: 2,
  title: 'Very Long Document Title That Should Wrap Properly in the Interface',
  description:
    'This document has a very long title to test how the component handles text wrapping',
  author: 'Jane Smith',
  date: '2024-02-20',
  fileUrl: 'https://www.africau.edu/images/default/sample.pdf',
};

const technicalDocument: IGRPDocumentItem = {
  id: 3,
  title: 'Technical Specification Document',
  description: 'Technical documentation with detailed specifications',
  author: 'Technical Team',
  date: '2024-03-10',
  fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
};

const meta: Meta<typeof IGRPPdfViewer> = {
  title: 'Components/PdfViewer',
  component: IGRPPdfViewer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A versatile PDF viewer component that can display PDFs either in a modal dialog or inline on the page.',
      },
    },
  },
  argTypes: {
    document: {
      description: 'The document object containing PDF information',
      control: 'object',
    },
    displayMode: {
      description: 'How to display the PDF viewer',
      control: 'select',
      options: ['modal', 'inline'],
    },
    inlineHeight: {
      description: 'Height of the inline PDF viewer',
      control: 'text',
    },
    labelButtonCancel: {
      description: 'Label for the cancel/close button',
      control: 'text',
    },
    labelButtonNewTab: {
      description: 'Label for the "open in new tab" button',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof IGRPPdfViewer>;

// Default Modal Story
export const Default: Story = {
  args: {
    document: sampleDocument,
    displayMode: 'modal',
    labelButtonCancel: 'Close',
    labelButtonNewTab: 'Open in new tab',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default modal version. Click the document card to open the PDF in a modal dialog.',
      },
    },
  },
};

// Inline Version
export const Inline: Story = {
  args: {
    document: sampleDocument,
    displayMode: 'inline',
    inlineHeight: '500px',
  },
  parameters: {
    docs: {
      description: {
        story: 'Inline version displays the PDF directly on the page without requiring a modal.',
      },
    },
  },
};

// Inline Without Card
export const InlineWithoutCard: Story = {
  args: {
    document: sampleDocument,
    displayMode: 'inline',
    inlineHeight: '400px',
  },
  parameters: {
    docs: {
      description: {
        story: 'Inline version without the document card, showing only the PDF viewer.',
      },
    },
  },
};

// Long Title Document
export const LongTitle: Story = {
  args: {
    document: longTitleDocument,
    displayMode: 'modal',
  },
  parameters: {
    docs: {
      description: {
        story: 'Example with a long document title to demonstrate text wrapping behavior.',
      },
    },
  },
};

// Technical Document
export const TechnicalDocument: Story = {
  args: {
    document: technicalDocument,
    displayMode: 'inline',
    inlineHeight: '600px',
  },
  parameters: {
    docs: {
      description: {
        story: 'Technical document example with inline display and custom height.',
      },
    },
  },
};

// Custom Labels
export const CustomLabels: Story = {
  args: {
    document: sampleDocument,
    displayMode: 'modal',
    labelButtonCancel: 'Cerrar',
    labelButtonNewTab: 'Abrir en nueva pestaña',
  },
  parameters: {
    docs: {
      description: {
        story: 'Example with custom button labels (Spanish in this case).',
      },
    },
  },
};

// Small Height Inline
export const SmallHeightInline: Story = {
  args: {
    document: sampleDocument,
    displayMode: 'inline',
    inlineHeight: '300px',
  },
  parameters: {
    docs: {
      description: {
        story: 'Inline version with a smaller height to fit in compact spaces.',
      },
    },
  },
};

// Large Height Inline
export const LargeHeightInline: Story = {
  args: {
    document: sampleDocument,
    displayMode: 'inline',
    inlineHeight: '80vh',
  },
  parameters: {
    docs: {
      description: {
        story: 'Inline version with a large height for better document viewing.',
      },
    },
  },
};

// Multiple Documents Showcase
export const MultipleDocuments: Story = {
  render: () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-2'>Modal Version</h3>
        <IGRPPdfViewer
          document={sampleDocument}
          displayMode='modal'
        />
      </div>
      <div>
        <h3 className='text-lg font-semibold mb-2'>Technical Document</h3>
        <IGRPPdfViewer
          document={technicalDocument}
          displayMode='modal'
        />
      </div>
      <div>
        <h3 className='text-lg font-semibold mb-2'>Long Title Document</h3>
        <IGRPPdfViewer
          document={longTitleDocument}
          displayMode='modal'
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Showcase of multiple documents with different titles and content.',
      },
    },
  },
};

// Comparison View
export const ComparisonView: Story = {
  render: () => (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
      <div>
        <h3 className='text-lg font-semibold mb-4'>Modal Version</h3>
        <IGRPPdfViewer
          document={sampleDocument}
          displayMode='modal'
        />
      </div>
      <div>
        <h3 className='text-lg font-semibold mb-4'>Inline Version</h3>
        <IGRPPdfViewer
          document={sampleDocument}
          displayMode='inline'
          inlineHeight='400px'
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of modal and inline display modes.',
      },
    },
  },
};
