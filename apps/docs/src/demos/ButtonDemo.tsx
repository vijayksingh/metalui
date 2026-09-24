import { Button } from '@unlocalhosted/metalui';
import { DuplicateIcon, SendAwayIcon, ShareIcon } from '@unlocalhosted/metalui/icons';

/** The three caps, with and without a leading icon (14px in a 32 control). */
export function ButtonDemo() {
  return (
    <div className="flex flex-col items-center gap-16">
      <div className="flex flex-wrap justify-center gap-8">
        <Button cap="primary">New Canvas</Button>
        <Button>Cancel</Button>
        <Button cap="destructive">Delete</Button>
      </div>
      <div className="flex flex-wrap justify-center gap-8">
        <Button><ShareIcon size={14} />Export</Button>
        <Button><DuplicateIcon size={14} />Duplicate</Button>
        <Button cap="destructive"><SendAwayIcon size={14} />Send away</Button>
        <Button disabled>Disabled</Button>
      </div>
    </div>
  );
}
