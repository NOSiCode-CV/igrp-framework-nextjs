import type { IGRPBaseAttributes, IGRPGridSize } from '../../../../types';

export type IGRPDatePickerBaseProps = {
  error?: string;
  required?: boolean;
  disabledPicker?: boolean;
  gridSize?: IGRPGridSize;
  dateFormat?: string;
  placeholder?: string;
} & Pick<IGRPBaseAttributes, 'label' | 'helperText' | 'labelClassName' | 'name'>;
