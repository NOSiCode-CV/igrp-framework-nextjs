import { IGRPBadgePrimitive, IGRPButtonPrimitive, IGRPCardDetails } from '@igrp/igrp-framework-react-design-system';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
  title: "Components/Card-Details",
  component: IGRPCardDetails,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "Card title",
    },
    description: {
      control: "text",
      description: "Card description",
    },
    items: {
      control: "object",
      description: "Array of detail items to display",
    },
  },
} satisfies Meta<typeof IGRPCardDetails>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: "User Information",
    description: "Basic details about the user account",
    items: [
      { label: "Full Name", content: "John Doe" },
      { label: "Email", content: "john.doe@example.com" },
      { label: "Phone", content: "+1 (555) 123-4567" },
      { label: "Location", content: "San Francisco, CA" },
    ],
  },
}

export const WithCopyButtons: Story = {
  args: {
    title: "API Credentials",
    description: "Your API keys and authentication details",
    items: [
      { label: "API Key", content: "sk_live_1234567890abcdef", showCopyTo: true },
      { label: "Secret Key", content: "sk_secret_abcdef1234567890", showCopyTo: true },
      { label: "Webhook URL", content: "https://api.example.com/webhook", showCopyTo: true },
      { label: "Environment", content: "Production" },
    ],    
  },
}

export const WithCustomContent: Story = {
  args: {
    title: "Order Details",
    description: "Information about your recent order",
    items: [
      { label: "Order ID", content: "#ORD-2024-001" },
      {
        label: "Status",
        content: <IGRPBadgePrimitive variant="default">Shipped</IGRPBadgePrimitive>,
      },
      { label: "Total Amount", content: "$299.99" },
      {
        label: "Shipping Address",
        content: "123 Main St, Apt 4B, New York, NY 10001",
      },
      { label: "Estimated Delivery", content: "March 15, 2024" },
      {
        label: "Tracking",
        content: <IGRPBadgePrimitive variant="outline">1Z999AA10123456784</IGRPBadgePrimitive>,
      },
    ],
  },
}

export const NoHeaderContent: Story = {
  args: {
    items: [
      { label: "Username", content: "johndoe" },
      { label: "Member Since", content: "January 2024" },
      { label: "Last Login", content: "2 hours ago" },
      { label: "Account Type", content: "Premium" },
    ],
  },
}

export const SingleColumn: Story = {
  args: {
    title: "System Information",
    description: "Current system status and configuration",
    contentClassName: "md:grid-cols-1",
    items: [
      { label: "Server Status", content: <IGRPBadgePrimitive variant="default">Online</IGRPBadgePrimitive> },
      { label: "Uptime", content: "99.9%" },
      { label: "Last Backup", content: "2024-03-10 14:30:00 UTC" },
      { label: "Database Size", content: "2.4 GB" },
    ],
  },
}

export const ManyItems: Story = {
  args: {
    title: "Complete Profile",
    description: "All available user information",
    items: [
      { label: "First Name", content: "John" },
      { label: "Last Name", content: "Doe" },
      { label: "Email", content: "john.doe@example.com", showCopyTo: true },
      { label: "Phone", content: "+1 (555) 123-4567" },
      { label: "Date of Birth", content: "January 15, 1990" },
      { label: "Gender", content: "Male" },
      { label: "Address", content: "123 Main Street" },
      { label: "City", content: "San Francisco" },
      { label: "State", content: "California" },
      { label: "ZIP Code", content: "94102" },
      { label: "Country", content: "United States" },
      { label: "Occupation", content: "Software Engineer" },
    ],    
  },
}

export const EmptyState: Story = {
  args: {
    title: "No Data",
    description: "This component returns null when items array is empty",
    items: [],
  },
}

export const LongContent: Story = {
  args: {
    title: "Detailed Information",
    description: "Example with longer text content",
    items: [
      {
        label: "Description",
        content:
          "This is a very long description that demonstrates how the component handles text wrapping and longer content. It should wrap nicely within the available space.",
      },
      {
        label: "Notes",
        content:
          "Additional notes can be quite lengthy as well. The component uses a flexible layout that adapts to the content size while maintaining readability.",
      },
      { label: "Short Field", content: "Brief" },
      { label: "Another Field", content: "Value" },
    ],
  },
}

export const MixedContentTypes: Story = {
  args: {
    title: "Dashboard Overview",
    description: "Various types of content in one card",
    items: [
      {
        label: "Active Users",
        content: <span className="text-2xl font-bold text-green-600">1,234</span>,
      },
      {
        label: "Status",
        content: (
          <div className="flex gap-2">
            <IGRPBadgePrimitive variant="default">Active</IGRPBadgePrimitive>
            <IGRPBadgePrimitive variant="outline">Verified</IGRPBadgePrimitive>
          </div>
        ),
      },
      { label: "API Key", content: "pk_live_abc123xyz", showCopyTo: true },
      {
        label: "Actions",
        content: (
          <IGRPButtonPrimitive variant="outline" size="sm">
            View Details
          </IGRPButtonPrimitive>
        ),
      },
    ],
  },
}
