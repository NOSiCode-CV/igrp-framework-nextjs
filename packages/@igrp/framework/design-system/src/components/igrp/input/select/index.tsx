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
import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/primitives/form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/primitives/select';
import { Input } from '@/components/horizon/input';
import { IGRPButton } from '@/components/igrp/button';
import { IGRPIcon } from '@/components/igrp/icon';
import { IGRPLabel } from '@/components/igrp/label';
import { Circle } from 'lucide-react';
import { cn, igrpColorText } from '@/lib/utils';
import type { IGRPBaseAttributes, IGRPGridSize, IGRPOptionsProps } from '@/types/globals';
import { igrpGridSizeClasses } from '@/lib/constants';

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

interface IGRPSelectProps
  extends Omit<IGRPBaseAttributes, 'ref'>,
    React.ComponentProps<typeof Select> {
  options: IGRPOptionsProps[];
  placeholder?: string;
  className?: string;
  showSearch?: boolean;
  required?: boolean;
  error?: string;
  showStatus?: boolean;
  selectClassName?: string;
  showGroup?: boolean;
  gridSize?: IGRPGridSize;
}

function IGRPSelect({
  options,
  placeholder = 'Select an option',
  className,
  showSearch = false,
  name,
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
  gridSize = 'default',
  ...props
}: IGRPSelectProps) {
  const formContext = useFormContext();
  const id = useId();
  const fieldName = name ?? id;

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

  const renderSelect = (value: string, onChange: (val: string) => void) => (
    <Select
      value={value}
      onValueChange={onChange}
      onOpenChange={(open) => dispatch({ type: 'SET_OPEN', payload: open })}
      disabled={disabled}
      {...props}
    >
      <IGRPSelectTrigger
        className={className}
        showStatus={showStatus}
        value={value}
        options={options}
        placeholder={placeholder}
        isOpen={state.isOpen}
        label={selectedLabel}
      />

      <IGRPSelectContent
        showSearch={showSearch}
        search={state.search}
        setSearch={(val) => dispatch({ type: 'SET_SEARCH', payload: val as string })}
        onResetSearch={() => dispatch({ type: 'RESET_SEARCH' })}
        options={options}
        filteredOptions={filteredOptions}
        showStatus={showStatus}
        showGroup={showGroup}
      />
    </Select>
  );

  if (!formContext) {
    return (
      <div className={cn('space-y-2', className)}>
        <IGRPLabel
          id={fieldName}
          className={labelClassName}
          required={required}
          label={label}
        />

        <div className='relative'>{renderSelect(state.selected, handleChange)}</div>

        {helperText && !error && (
          <p
            className='text-muted-foreground text-xs mt-1'
            role='note'
          >
            {helperText}
          </p>
        )}

        {error && (
          <p
            className='text-destructive text-xs mt-1'
            role='alert'
          >
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
        <FormItem className={cn('space-y-2', igrpGridSizeClasses[gridSize], className)}>
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
            {renderSelect(field.value, (val) => {
              field.onChange(val);
              handleChange(val);
            })}
          </FormControl>

          {helperText && !fieldState.error && <FormDescription>{helperText}</FormDescription>}
          <FormMessage className='text-xs' />
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
    <div className='flex items-center gap-2 pb-3 mb-2 border-b'>
      <div className='relative flex-1'>
        <IGRPIcon
          iconName='Search'
          className='absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground'
        />
        <Input
          type='text'
          className='pl-7 h-8 text-sm'
          placeholder='Search...'
          aria-label='Search options'
          value={search}
          onChange={(e) => setSearch(e.target.value.trimStart())}
        />
      </div>
      {search && (
        <IGRPButton
          onClick={onResetSearch}
          aria-label='Clear search'
          variant='ghost'
          size='icon'
          className='h-8 w-8 p-0'
          iconName='X'
        />
      )}
    </div>
  ),
);

const IGRPSelectItem = memo(
  ({ item, showStatus }: { item: IGRPOptionsProps; showStatus: boolean }) => (
    <SelectItem
      value={item.value}
      className='flex items-center gap-2 truncate'
    >
      <div className='flex items-center gap-2 w-full'>
        {showStatus && (
          <Circle className={cn('h-2 w-2 fill-current', igrpColorText(item.status || 'primary'))} />
        )}
        {item.image && (
          <img
            className='h-5 w-5 rounded'
            src={item.image || '/placeholder.svg'}
            alt={item.label}
            width={20}
            height={20}
          />
        )}
        <div className='flex flex-col'>
          <span>{item.label}</span>
          {item.description && (
            <span className='text-muted-foreground text-xs'>{item.description}</span>
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
      <SelectContent className='max-h-[300px] overflow-y-auto'>
        {showSearch && (
          <IGRPSelectSearch
            search={search}
            setSearch={setSearch}
            onResetSearch={onResetSearch}
          />
        )}
        {showGroup && groups.length > 0
          ? groups.map((group) => (
              <Fragment key={group}>
                <SelectGroup>
                  <SelectLabel className='text-xs text-muted-foreground px-2'>{group}</SelectLabel>
                  {filteredOptions
                    .filter((opt) => opt.group === group)
                    .map((opt) => (
                      <IGRPSelectItem
                        key={opt.value}
                        item={opt}
                        showStatus={showStatus}
                      />
                    ))}
                </SelectGroup>
              </Fragment>
            ))
          : filteredOptions.map((opt) => (
              <IGRPSelectItem
                key={opt.value}
                item={opt}
                showStatus={showStatus}
              />
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
  <SelectTrigger
    className={cn('w-full', className)}
    aria-expanded={isOpen}
  >
    <SelectValue
      placeholder={placeholder}
      className='w-full'
    >
      <div className='w-full flex items-center gap-2 truncate'>
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
