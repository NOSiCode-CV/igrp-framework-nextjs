'use client';

import {
  useId,
  useReducer,
  useMemo,
  useCallback,
  memo,
  Fragment,
  type SetStateAction,
  type Dispatch,
} from 'react';
import Image from 'next/image';
import { useFormContext } from 'react-hook-form';
import { Circle } from 'lucide-react';

import { igrpColorText } from '../../../lib/colors';
import { cn } from '../../../lib/utils';
import type { IGRPInputProps, IGRPOptionsProps } from '../../../types';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../ui/form';
import { Input } from '../../ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { IGRPButton } from '../button';
import { IGRPIcon } from '../icon';
import { IGRPLabel } from '../label';

type SelectState = {
  selected: string;
  search: string;
  isOpen: boolean;
};

type SelectAction =
  | { type: 'SET_SELECTED'; payload: string }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_OPEN'; payload: boolean }
  | { type: 'RESET_SEARCH' };

function selectReducer(state: SelectState, action: SelectAction): SelectState {
  switch (action.type) {
    case 'SET_SELECTED':
      return { ...state, selected: action.payload };
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_OPEN':
      return { ...state, isOpen: action.payload };
    case 'RESET_SEARCH':
      return { ...state, search: '' };
    default:
      return state;
  }
}

/**
 * Props for the IGRPSelect component.
 * @see IGRPSelect
 */
type IGRPSelectProps = Omit<
  React.ComponentProps<typeof Select>,
  'value' | 'defaultValue' | 'onValueChange' | 'children'
> &
  Omit<IGRPInputProps, 'autoComplete' | 'defaultValue' | 'dir' | 'value'> & {
    options: IGRPOptionsProps[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    showSearch?: boolean;
    required?: boolean;
    error?: string;
    showStatus?: boolean;
    selectClassName?: string;
    showGroup?: boolean;
    id?: string;
    label?: string;
    labelClassName?: string;
    helperText?: string;
  };

/** @internal Select field with trigger and content. */
function IGRPSelectField({
  value,
  onChange,
  onOpenChange,
  disabled,
  options,
  placeholder,
  isOpen,
  label,
  showSearch,
  search,
  setSearch,
  onResetSearch,
  filteredOptions,
  showStatus,
  showGroup,
  className,
  ...selectProps
}: {
  value: string;
  onChange: (val: string) => void;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  options: IGRPOptionsProps[];
  placeholder: string;
  isOpen: boolean;
  label: string;
  showSearch: boolean;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  onResetSearch: () => void;
  filteredOptions: IGRPOptionsProps[];
  showStatus: boolean;
  showGroup: boolean;
  className?: string;
} & Omit<
  React.ComponentProps<typeof Select>,
  'value' | 'onValueChange' | 'onOpenChange' | 'children'
>) {
  return (
    <Select
      value={value}
      onValueChange={onChange}
      onOpenChange={onOpenChange}
      disabled={disabled}
      {...selectProps}
    >
      <IGRPSelectTrigger
        className={className}
        showStatus={showStatus}
        value={value}
        options={options}
        placeholder={placeholder}
        isOpen={isOpen}
        label={label}
      />
      <IGRPSelectContent
        showSearch={showSearch}
        search={search}
        setSearch={setSearch}
        onResetSearch={onResetSearch}
        options={options}
        filteredOptions={filteredOptions}
        showStatus={showStatus}
        showGroup={showGroup}
      />
    </Select>
  );
}

/**
 * Select dropdown with optional search and grouped options. Integrates with react-hook-form.
 */
function IGRPSelect({
  options,
  placeholder = 'Select an option',
  className,
  showSearch = false,
  name,
  id,
  required,
  disabled,
  error,
  helperText,
  showStatus = false,
  value,
  onValueChange,
  label = 'Select an option',
  labelClassName,
  showGroup = false,
  ...props
}: IGRPSelectProps) {
  const _id = useId();
  const fieldName = name ?? id ?? _id;

  const formContext = useFormContext();

  const [state, dispatch] = useReducer(selectReducer, {
    selected: value || '',
    search: '',
    isOpen: false,
  });

  const optionsMap = useMemo(() => new Map(options.map((opt) => [opt.value, opt])), [options]);

  const normalizedSearch = state.search.trim().toLowerCase();
  const filteredOptions = useMemo(
    () => options.filter(({ label }) => label.toLowerCase().includes(normalizedSearch)),
    [options, normalizedSearch],
  );

  const selectedLabel = useMemo(() => {
    if (formContext) {
      const selectedValue = formContext.getValues(fieldName);
      return selectedValue ? optionsMap.get(selectedValue)?.label || selectedValue : '';
    } else {
      return state.selected ? optionsMap.get(state.selected)?.label || state.selected : '';
    }
  }, [formContext, fieldName, state.selected, optionsMap]);

  const handleChange = useCallback(
    (val: string) => {
      if (val !== state.selected) {
        dispatch({ type: 'SET_SELECTED', payload: val });
        onValueChange?.(val);
      }
    },
    [state.selected, onValueChange],
  );

  const selectFieldProps = {
    onOpenChange: (open: boolean) => dispatch({ type: 'SET_OPEN', payload: open }),
    disabled,
    options,
    placeholder,
    isOpen: state.isOpen,
    label: selectedLabel,
    showSearch,
    search: state.search,
    setSearch: (val: SetStateAction<string>) =>
      dispatch({
        type: 'SET_SEARCH',
        payload: typeof val === 'function' ? (val as (prev: string) => string)(state.search) : val,
      }),
    onResetSearch: () => dispatch({ type: 'RESET_SEARCH' }),
    filteredOptions,
    showStatus,
    showGroup,
    className,
    ...props,
  };

  if (!formContext) {
    return (
      <div className={cn('space-y-2', className)}>
        <IGRPLabel id={fieldName} className={labelClassName} required={required} label={label} />

        <div className={cn('relative')}>
          <IGRPSelectField
            {...selectFieldProps}
            value={state.selected}
            onChange={handleChange}
          />
        </div>

        {helperText && !error && (
          <p className={cn('text-muted-foreground text-xs mt-1')} role="note">
            {helperText}
          </p>
        )}

        {error && (
          <p className={cn('text-destructive text-xs mt-1')} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <FormField
      control={formContext.control}
      name={fieldName}
      render={({ field, fieldState }) => (
        <FormItem className={cn(className)}>
          {label && (
            <FormLabel
              className={cn(
                labelClassName,
                required && 'after:content-["*"] after:text-destructive',
              )}
            >
              {label}
            </FormLabel>
          )}
          <FormControl>
            <IGRPSelectField
              {...selectFieldProps}
              value={field.value ?? ''}
              onChange={(val) => {
                field.onChange(val);
                handleChange(val);
              }}
            />
          </FormControl>

          {helperText && !fieldState.error && <FormDescription>{helperText}</FormDescription>}
          <FormMessage className={cn('text-xs')} />
        </FormItem>
      )}
    />
  );
}

const IGRPSelectSearch = memo(
  ({
    search,
    setSearch,
    onResetSearch,
  }: {
    search: string;
    setSearch: Dispatch<SetStateAction<string>>;
    onResetSearch: () => void;
  }) => (
    <div className={cn('flex items-center gap-2 pb-3 mb-2 border-b')}>
      <div className={cn('relative flex-1')}>
        <IGRPIcon
          iconName="Search"
          className={cn('absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground')}
        />
        <Input
          type="text"
          className={cn('pl-7 h-8 text-sm')}
          placeholder="Search..."
          aria-label="Search options"
          value={search}
          onChange={(e) => setSearch(e.target.value.trimStart())}
        />
      </div>
      {search && (
        <IGRPButton
          onClick={onResetSearch}
          aria-label="Clear search"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 p-0')}
          iconName="X"
        />
      )}
    </div>
  ),
);

const IGRPSelectItem = memo(
  ({ item, showStatus }: { item: IGRPOptionsProps; showStatus: boolean }) => (
    <SelectItem value={String(item.value)} className={cn('flex items-center gap-2 truncate')}>
      <div className={cn('flex items-center gap-2 w-full')}>
        {showStatus && (
          <Circle className={cn('h-2 w-2 fill-current', igrpColorText(item.status || 'primary'))} />
        )}
        {item.image && (
          <Image
            className={cn('h-5 w-5 rounded')}
            src={item.image || '/placeholder.svg'}
            alt={item.label}
            width={20}
            height={20}
          />
        )}
        <div className={cn('flex flex-col')}>
          <span>{item.label}</span>
          {item.description && (
            <span className={cn('text-muted-foreground text-xs')}>{item.description}</span>
          )}
        </div>
      </div>
    </SelectItem>
  ),
);

const IGRPSelectContent = memo(
  ({
    showSearch,
    search,
    setSearch,
    onResetSearch,
    options,
    filteredOptions,
    showStatus,
    showGroup,
  }: {
    showSearch: boolean;
    search: string;
    setSearch: Dispatch<SetStateAction<string>>;
    onResetSearch: () => void;
    options: IGRPOptionsProps[];
    filteredOptions: IGRPOptionsProps[];
    showStatus: boolean;
    showGroup: boolean;
  }) => {
    const groups = useMemo(
      () => Array.from(new Set(options.map((opt) => opt.group).filter(Boolean))),
      [options],
    );

    return (
      <SelectContent className={cn('max-h-[300px] overflow-y-auto')}>
        {showSearch && (
          <IGRPSelectSearch search={search} setSearch={setSearch} onResetSearch={onResetSearch} />
        )}
        {showGroup && groups.length > 0
          ? groups.map((group) => (
              <Fragment key={group}>
                <SelectGroup>
                  <SelectLabel className={cn('text-xs text-muted-foreground px-2')}>
                    {group}
                  </SelectLabel>
                  {filteredOptions
                    .filter((opt) => opt.group === group)
                    .map((opt) => (
                      <IGRPSelectItem key={opt.value} item={opt} showStatus={showStatus} />
                    ))}
                </SelectGroup>
              </Fragment>
            ))
          : filteredOptions.map((opt) => (
              <IGRPSelectItem key={opt.value} item={opt} showStatus={showStatus} />
            ))}
      </SelectContent>
    );
  },
);

const IGRPSelectTrigger = ({
  value,
  options,
  placeholder,
  showStatus,
  label,
  isOpen,
  className,
}: {
  value: string;
  options: IGRPOptionsProps[];
  placeholder: string;
  showStatus: boolean;
  label: string;
  isOpen: boolean;
  className?: string;
}) => (
  <SelectTrigger className={cn('w-full', className)} aria-expanded={isOpen}>
    <SelectValue placeholder={placeholder} className={cn('w-full')}>
      <div className={cn('w-full flex items-center gap-2 truncate')}>
        {showStatus && (
          <Circle
            className={cn(
              'h-2 w-2 fill-current',
              igrpColorText(options.find((o) => o.value === value)?.status || 'primary'),
            )}
          />
        )}
        {label}
      </div>
    </SelectValue>
  </SelectTrigger>
);

export { IGRPSelect, type IGRPSelectProps };
