# Design System

The IGRP component kit (`@igrp/igrp-framework-react-design-system`): the vocabulary for fields, their values and how they bind to forms.

## Fields

**Horizon field**:
A Horizon (`IGRP*`) component that captures one value and binds to the surrounding `IGRPForm` through its `name`.
_Avoid_: input, form control, widget

**Form-bound**:
The mode of a Horizon field that reads and writes its value through the surrounding `IGRPForm`, keyed by `name`.
_Avoid_: uncontrolled, connected

**Controlled**:
The mode of a Horizon field used outside `IGRPForm`, whose value is owned by the caller through `value` / `onChange`.
_Avoid_: standalone

**Option**:
One entry of the closed list a choice field offers, identified by its `value` code and shown by its `label`.
_Avoid_: item, choice, entry

**Option card**:
An option shown as a clickable surface carrying its label, description and optional icon; its selected look follows the radio's own state, never a flag the caller computes.
_Avoid_: radio card, tile, choice card, cards visuais

## Multi-value fields

**Selection**:
The ordered list of option codes a multi-value field holds, always in option order, never click order.
_Avoid_: values, picks, choices

**Unmatched code**:
A code in a selection that no current option carries (options still loading, or a retired code); it stays in the selection.
_Avoid_: invalid value, orphan

**Chip**:
One member of a selection echoed below the field's trigger, with its own remove control.
_Avoid_: tag, pill, badge

**Bulk actions**:
The "select all" and "clear" controls that replace a selection in one step.
_Avoid_: batch actions, footer actions

## Rich text

**Rich-text schema**:
The single set of nodes, marks and attributes that rich text may contain; the editor writes only what it declares and the viewer renders only what it declares, so the two can never disagree.
_Avoid_: extensions, allow-list, sanitiser

**Toolbar preset**:
A named set of formatting controls an editor offers an author (`email`, `full`); it narrows what can be authored, never what the schema can store or render.
_Avoid_: preset (alone), mode, profile

**Email-safe**:
Formatting whose output survives a strict HTML allow-list that strips every `style` and `class` attribute; the `email` toolbar preset offers only this.
_Avoid_: basic, minimal, simple

**Control**:
One toolbar affordance of the rich-text editor (bold, link, table, …); an explicit list of controls replaces the toolbar preset.
_Avoid_: button, tool, action

**Template variable**:
A `{{name}}` token inserted into rich text as plain text, for a backend to substitute when it renders the body; the editor never treats it as a unit.
_Avoid_: placeholder, merge field, tag
