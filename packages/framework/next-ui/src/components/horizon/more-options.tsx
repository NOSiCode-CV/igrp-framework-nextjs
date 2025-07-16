import ContrastChecker from '../horizon/contrast-checker';
import { Button } from '../primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu';
import { useEditorStore } from '../../store/editor-store';
import { MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { MCPDialog } from './mcp-dialog';

interface MoreOptionsProps extends React.ComponentProps<typeof DropdownMenuTrigger> {}

export function MoreOptions({ ...props }: MoreOptionsProps) {
  const [mcpDialogOpen, setMcpDialogOpen] = useState(false);
  const { themeState } = useEditorStore();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild {...props}>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-foreground">
          <DropdownMenuItem onClick={() => setMcpDialogOpen(true)} asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <span className="text-sm">MCP</span>
            </Button>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild>
            <ContrastChecker currentStyles={themeState.styles[themeState.currentMode]} />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MCPDialog open={mcpDialogOpen} onOpenChange={setMcpDialogOpen} />
    </>
  );
}
