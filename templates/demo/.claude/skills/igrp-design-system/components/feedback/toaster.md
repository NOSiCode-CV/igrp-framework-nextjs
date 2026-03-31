# IGRPToaster, useIGRPToast

## Setup

Add `<IGRPToaster />` to your root layout.

## Usage

```tsx
const { toast } = useIGRPToast();

toast.success('Saved successfully');
toast.error('Failed to save');
toast('Default message');
```
