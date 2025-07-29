import { Button } from '../../primitives/button';
import { IGRPIcon, type IGRPIconName } from '../icon';

interface IGRPPageHeaderBackButtonProps extends React.ComponentProps<typeof Button> {
  url?: string;
  iconName?: IGRPIconName | string;
}
function IGRPPageHeaderBackButton({
  url = '/',
  iconName = 'ArrowLeft',
  ...props
}: IGRPPageHeaderBackButtonProps) {
  return (
    <Button variant="outline" size="icon" asChild {...props}>
      <a href={url}>
        <IGRPIcon iconName={iconName} />
      </a>
    </Button>
  );
}

export { IGRPPageHeaderBackButton, type IGRPPageHeaderBackButtonProps };
