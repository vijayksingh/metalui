import { Button } from './button';
import { DuplicateIcon, SendAwayIcon, ShareIcon } from '../../src/icons';

export default function ButtonDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        <Button cap="primary">New Canvas</Button>
        <Button>Cancel</Button>
        <Button cap="destructive">Delete</Button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        <Button>
          <ShareIcon size={16} />
          Export
        </Button>
        <Button>
          <DuplicateIcon size={16} />
          Duplicate
        </Button>
        <Button cap="destructive">
          <SendAwayIcon size={16} />
          Send away
        </Button>
        <Button disabled>Disabled</Button>
      </div>
    </div>
  );
}
