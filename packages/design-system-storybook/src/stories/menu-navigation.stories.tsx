import type { Meta, StoryFn, StoryObj } from '@storybook/nextjs-vite';
import { useState, useRef } from 'react';
import z from 'zod';
import {
  IGRPMenuNavigation,
  IGRPMenuNavigationProvider,
  useIGRPMenuNavigation,
  type IGRPMenuNavigationItem,
  type IGRPMenuNavigationProps,
  IGRPColorObjectRole,
  IGRPColorObjectVariants,
  IGRPFormList,
  IGRPForm,
  IGRPInputText,
  IGRPSelect,
  type IGRPFormHandle,
  type IGRPOptionsProps,
} from '@igrp/igrp-framework-react-design-system';

const meta: Meta<typeof IGRPMenuNavigation> = {
  title: 'Components/MenuNavigation',
  component: IGRPMenuNavigation,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title displayed in the header',
    },
    badgeContent: {
      control: 'text',
      description: 'Content to display in the badge',
    },
    badgeVariant: {
      control: 'select',
      options: IGRPColorObjectRole,
      description: 'Variant style of the badge',
    },
    badgeColor: {
      control: 'select',
      options: IGRPColorObjectVariants,
      description: 'Color of the badge',
    },
    badgeClassName: {
      control: 'text',
      description: 'Custom className for the badge',
    },
    showChevron: {
      control: 'boolean',
      description: 'Whether to show chevron icons',
    },
    isStickyTop: {
      control: 'boolean',
      description: 'Whether the navigation should stick to the top',
    },
    className: {
      control: 'text',
      description: 'Custom className for the component',
    },
  },
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof IGRPMenuNavigation>;

// Sample sections data
const defaultSections: IGRPMenuNavigationItem[] = [
  { id: 'overviewOver', label: 'Overview', icon: 'Home' },
  { id: 'settingsSet', label: 'Settings', icon: 'Settings' },
  { id: 'profilePro', label: 'Profile', icon: 'User' },
  { id: 'securitySec', label: 'Security', icon: 'Shield' },
];

const manySections: IGRPMenuNavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart' },
  { id: 'users', label: 'Users', icon: 'Users' },
  { id: 'products', label: 'Products', icon: 'Package' },
  { id: 'orders', label: 'Orders', icon: 'ShoppingCart' },
  { id: 'reports', label: 'Reports', icon: 'FileText' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
  { id: 'help', label: 'Help & Support', icon: 'HelpCircle' },
];

const sectionsWithDisabled: IGRPMenuNavigationItem[] = [
  { id: 'overview', label: 'Overview', icon: 'Home' },
  { id: 'settings', label: 'Settings', icon: 'Settings', disabled: true },
  { id: 'profile', label: 'Profile', icon: 'User' },
  { id: 'security', label: 'Security', icon: 'Shield', disabled: true },
];

// Template
const Template: StoryFn<IGRPMenuNavigationProps> = (args) => (
  <div className="container my-10 mx-auto max-w-md">
    <IGRPMenuNavigation {...args} />
  </div>
);

// Controlled component template
const ControlledTemplate: StoryFn<IGRPMenuNavigationProps> = (args) => {
  const [activeSection, setActiveSection] = useState(args.sections[0]?.id || '');

  return (
    <div className="container my-10 mx-auto max-w-md">
      <IGRPMenuNavigation
        {...args}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Active Section: <span className="font-medium">{activeSection}</span>
        </p>
      </div>
    </div>
  );
};

// With provider template (for scroll functionality)
const WithProviderTemplate: StoryFn<IGRPMenuNavigationProps> = (args) => {
  const [activeSection, setActiveSection] = useState(args.sections[0]?.id || '');

  return (
    <IGRPMenuNavigationProvider>
      <div className="container my-10 mx-auto max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <IGRPMenuNavigation
              {...args}
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
          </div>
          <div className="md:col-span-2 space-y-8">
            {args.sections.map((section) => (
              <SectionContent
                key={section.id}
                sectionId={section.id}
                label={section.label}
                isActive={activeSection === section.id}
              />
            ))}
          </div>
        </div>
      </div>
    </IGRPMenuNavigationProvider>
  );
};

// Helper component for section content
function SectionContent({
  sectionId,
  label,
  isActive,
}: {
  sectionId: string;
  label: string;
  isActive: boolean;
}) {
  const { getSectionRef } = useIGRPMenuNavigation();

  return (
    <div
      ref={getSectionRef(sectionId)}
      data-section-id={sectionId}
      className={`p-6 rounded-lg border-2 transition-colors ${
        isActive ? 'border-primary bg-primary/5' : 'border-border bg-card'
      }`}
    >
      <h2 className="text-2xl font-bold mb-4">{label}</h2>
      <p className="text-muted-foreground">
        This is the content for the {label.toLowerCase()} section. Scroll to see the navigation
        highlight the active section.
      </p>
      <div className="mt-4 space-y-2">
        <p>Section ID: {sectionId}</p>
        <p>Status: {isActive ? 'Active' : 'Inactive'}</p>
      </div>
    </div>
  );
}

export const Default: Story = {
  render: Template,
  args: {
    sections: defaultSections,
    title: 'Navigation',
  },
};

export const WithBadge: Story = {
  render: Template,
  args: {
    sections: defaultSections,
    title: 'Navigation',
    badgeContent: '4',
    badgeVariant: 'solid',
    badgeColor: 'primary',
  },
};

export const WithCustomTitle: Story = {
  render: Template,
  args: {
    sections: defaultSections,
    title: 'Menu',
    badgeContent: 'New',
    badgeVariant: 'soft',
    badgeColor: 'success',
  },
};

export const WithoutChevron: Story = {
  render: Template,
  args: {
    sections: defaultSections,
    title: 'Navigation',
    showChevron: false,
  },
};

export const WithDisabledItems: Story = {
  render: Template,
  args: {
    sections: sectionsWithDisabled,
    title: 'Navigation',
  },
};

export const ManySections: Story = {
  render: Template,
  args: {
    sections: manySections,
    title: 'Navigation',
  },
};

export const StickyTop: Story = {
  render: Template,
  args: {
    sections: defaultSections,
    title: 'Navigation',
    isStickyTop: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export const Controlled: Story = {
  render: ControlledTemplate,
  args: {
    sections: defaultSections,
    title: 'Navigation',
  },
};

export const WithProvider: Story = {
  render: WithProviderTemplate,
  args: {
    sections: defaultSections,
    title: 'Navigation',
  },
  parameters: {
    layout: 'fullscreen',
  },
};

export const BadgeVariants: Story = {
  render: () => (
    <div className="container my-10 mx-auto max-w-md space-y-4">
      <IGRPMenuNavigation
        sections={defaultSections}
        title="Solid Badge"
        badgeContent="5"
        badgeVariant="solid"
        badgeColor="primary"
      />
      <IGRPMenuNavigation
        sections={defaultSections}
        title="Soft Badge"
        badgeContent="3"
        badgeVariant="soft"
        badgeColor="success"
      />
      <IGRPMenuNavigation
        sections={defaultSections}
        title="Outline Badge"
        badgeContent="2"
        badgeVariant="outline"
        badgeColor="warning"
      />
    </div>
  ),
};

export const BadgeColors: Story = {
  render: () => (
    <div className="container my-10 mx-auto max-w-md space-y-4">
      <IGRPMenuNavigation
        sections={defaultSections}
        title="Primary"
        badgeContent="5"
        badgeVariant="solid"
        badgeColor="primary"
      />
      <IGRPMenuNavigation
        sections={defaultSections}
        title="Success"
        badgeContent="3"
        badgeVariant="solid"
        badgeColor="success"
      />
      <IGRPMenuNavigation
        sections={defaultSections}
        title="Warning"
        badgeContent="2"
        badgeVariant="solid"
        badgeColor="warning"
      />
      <IGRPMenuNavigation
        sections={defaultSections}
        title="Destructive"
        badgeContent="1"
        badgeVariant="solid"
        badgeColor="destructive"
      />
      <IGRPMenuNavigation
        sections={defaultSections}
        title="Info"
        badgeContent="4"
        badgeVariant="solid"
        badgeColor="info"
      />
    </div>
  ),
};

export const InteractiveExample: Story = {
  render: () => {
    const [activeSection, setActiveSection] = useState(defaultSections[0]?.id || 'overviewOver');

    return (
      <div className="container my-10 mx-auto max-w-md">
        <IGRPMenuNavigation
          sections={defaultSections}
          title="Navigation"
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          badgeContent="Active"
          badgeVariant="soft"
          badgeColor="primary"
        />
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Current Selection</h3>
          <p className="text-sm text-muted-foreground">
            You have selected: <span className="font-medium text-foreground">{activeSection}</span>
          </p>
        </div>
      </div>
    );
  },
};

// Form List Integration Story
const formListSections: IGRPMenuNavigationItem[] = [
  { id: 'socials', label: 'Social Links', icon: 'Link' },
  { id: 'contacts', label: 'Contacts', icon: 'Phone' },
  { id: 'addresses', label: 'Addresses', icon: 'MapPin' },
  { id: 'education', label: 'Education', icon: 'GraduationCap' },
];

// Schemas for different form sections
const SocialSchema = z.object({
  socials: z.array(
    z.object({
      platform: z.string().min(1, 'Required'),
      url: z.string().url('Invalid URL'),
    }),
  ),
});

const ContactSchema = z.object({
  contacts: z.array(
    z.object({
      name: z.string().min(1, 'Required'),
      phone: z.string().min(1, 'Required'),
      email: z.string().email('Invalid email'),
    }),
  ),
});

const AddressSchema = z.object({
  addresses: z.array(
    z.object({
      street: z.string().min(1, 'Required'),
      city: z.string().min(1, 'Required'),
      zipCode: z.string().min(1, 'Required'),
    }),
  ),
});

const EducationSchema = z.object({
  education: z.array(
    z.object({
      institution: z.string().min(1, 'Required'),
      degree: z.string().min(1, 'Required'),
      year: z.string().min(1, 'Required'),
    }),
  ),
});

const CombinedSchema = SocialSchema.merge(ContactSchema).merge(AddressSchema).merge(EducationSchema);
type CombinedFormValues = z.infer<typeof CombinedSchema>;

const mockSelectOptions: IGRPOptionsProps[] = [
  { value: 'facebook', label: 'Facebook', icon: 'Facebook' },
  { value: 'twitter', label: 'Twitter', icon: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'Linkedin' },
  { value: 'instagram', label: 'Instagram', icon: 'Instagram' },
];

const degreeOptions: IGRPOptionsProps[] = [
  { value: 'bachelor', label: "Bachelor's Degree" },
  { value: 'master', label: "Master's Degree" },
  { value: 'phd', label: 'PhD' },
  { value: 'certificate', label: 'Certificate' },
];

export const WithFormList: Story = {
  render: () => {
    const [activeSection, setActiveSection] = useState(formListSections[0]?.id || 'socials');
    const formRef = useRef<IGRPFormHandle<typeof CombinedSchema>>(null);

    const { getSectionRef } = useIGRPMenuNavigation();

    const renderSocialItem = (_item: CombinedFormValues['socials'][0], index: number) => (
      <div className="grid gap-4">
        <IGRPSelect
          name={`socials.${index}.platform`}
          label="Platform"
          placeholder="Select platform"
          options={mockSelectOptions}
          required
        />
        <IGRPInputText
          name={`socials.${index}.url`}
          label="URL"
          placeholder="https://..."
          required
          helperText="Enter the full URL"
        />
      </div>
    );

    const renderContactItem = (_item: CombinedFormValues['contacts'][0], index: number) => (
      <div className="grid gap-4">
        <IGRPInputText
          name={`contacts.${index}.name`}
          label="Name"
          placeholder="John Doe"
          required
        />
        <IGRPInputText
          name={`contacts.${index}.phone`}
          label="Phone"
          placeholder="+1 234 567 8900"
          required
        />
        <IGRPInputText
          name={`contacts.${index}.email`}
          label="Email"
          placeholder="john@example.com"
          type="email"
          required
        />
      </div>
    );

    const renderAddressItem = (_item: CombinedFormValues['addresses'][0], index: number) => (
      <div className="grid gap-4">
        <IGRPInputText
          name={`addresses.${index}.street`}
          label="Street Address"
          placeholder="123 Main St"
          required
        />
        <IGRPInputText
          name={`addresses.${index}.city`}
          label="City"
          placeholder="New York"
          required
        />
        <IGRPInputText
          name={`addresses.${index}.zipCode`}
          label="Zip Code"
          placeholder="10001"
          required
        />
      </div>
    );

    const renderEducationItem = (_item: CombinedFormValues['education'][0], index: number) => (
      <div className="grid gap-4">
        <IGRPInputText
          name={`education.${index}.institution`}
          label="Institution"
          placeholder="University Name"
          required
        />
        <IGRPSelect
          name={`education.${index}.degree`}
          label="Degree"
          placeholder="Select degree"
          options={degreeOptions}
          required
        />
        <IGRPInputText
          name={`education.${index}.year`}
          label="Year"
          placeholder="2020"
          required
        />
      </div>
    );

    return (
      <div className="container my-10 mx-auto max-w-6xl">
        <IGRPForm
          schema={CombinedSchema}
          formRef={formRef}
          onSubmit={(data) => {
            console.log('Form submitted:', data);
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <IGRPMenuNavigation
                sections={formListSections}
                title="Sections"
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                badgeContent={String(formListSections.length)}
                badgeVariant="soft"
                badgeColor="primary"
              />
            </div>
            <div className="lg:col-span-3">
              {activeSection === 'socials' && (
                <IGRPFormList
                  id="socials"
                  ref={getSectionRef("socials")}
                  data-section-id="socials" 
                  label="Social Links"
                  description="Add your social media profiles"
                  badgeValue="optional"
                  variant="soft"
                  color="primary"
                  defaultItem={{ platform: '', url: '' }}
                  renderItem={renderSocialItem}
                  computeLabel={(item, index) =>
                    item.platform ? `${item.platform} - ${item.url}` : `Social Link ${index + 1}`
                  }
                />
              )}

              {activeSection === 'contacts' && (
                <IGRPFormList
                  id="contacts"
                  ref={getSectionRef("contacts")}
                  data-section-id="contacts" 
                  label="Contacts"
                  description="Add contact information"
                  badgeValue="required"
                  variant="soft"
                  color="success"
                  defaultItem={{ name: '', phone: '', email: '' }}
                  renderItem={renderContactItem}
                  computeLabel={(item, index) =>
                    item.name ? `${item.name} - ${item.phone}` : `Contact ${index + 1}`
                  }
                />
              )}

              {activeSection === 'addresses' && (
                <IGRPFormList
                  id="addresses"
                  ref={getSectionRef("addresses")}
                  data-section-id="addresses" 
                  label="Addresses"
                  description="Add physical addresses"
                  badgeValue="optional"
                  variant="soft"
                  color="info"
                  defaultItem={{ street: '', city: '', zipCode: '' }}
                  renderItem={renderAddressItem}
                  computeLabel={(item, index) =>
                    item.street ? `${item.street}, ${item.city}` : `Address ${index + 1}`
                  }
                />
              )}

              {activeSection === 'education' && (
                <IGRPFormList
                  id="education"
                  ref={getSectionRef("education")}
                  data-section-id="education"                  // name="education"
                  label="Education"
                  description="Add educational background"
                  badgeValue="optional"
                  variant="soft"
                  color="warning"
                  defaultItem={{ institution: '', degree: '', year: '' }}
                  renderItem={renderEducationItem}
                  computeLabel={(item, index) =>
                    item.institution
                      ? `${item.institution} - ${item.degree}`
                      : `Education ${index + 1}`
                  }
                />
              )}
            </div>
          </div>
        </IGRPForm>
      </div>
    );
  },
  parameters: {
    layout: 'fullscreen',
  },
};