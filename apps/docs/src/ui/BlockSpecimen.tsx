import * as React from 'react';
import { ToastProvider } from '@unlocalhosted/metalui';
import { useColorway } from '../app/colorway';
import { AiComposer } from '../blocks/ai-composer/ai-composer';
import { AvailabilityPicker } from '../blocks/availability-picker/availability-picker';
import { Settings } from '../blocks/settings/settings';
import { SharePanel } from '../blocks/share-panel/share-panel';
import { StudioWeek } from '../blocks/studio-week/studio-week';
import { TaskInbox } from '../blocks/task-inbox/task-inbox';
import { SpecimenWindow } from './PlaceSpecimen';

export const BLOCK_CAPTIONS: Record<string, string> = {
  'ai-composer': 'Write a message, attach files, choose a model, and read its reply.',
  'share-panel': 'Invite people, set their access, and share a folder with its files.',
  'availability-picker': 'Choose a day and an available time, then book a call.',
  'task-inbox': 'Find, complete, and organise tasks from one inbox.',
  settings: 'Edit your profile, notifications, and appearance, then save together.',
  'studio-week': 'Read a week of workspace activity, hour by hour.',
};

/** Each window holds the complete copied block, at its own responsive width. */
export function BlockSpecimen({ name }: { name: string }) {
  const { colorway } = useColorway();
  switch (name) {
    case 'ai-composer': return <SpecimenWindow width={560} height={592}><AiComposer /></SpecimenWindow>;
    case 'share-panel': return <SpecimenWindow width={576} height={736}><SharePanel /></SpecimenWindow>;
    case 'availability-picker': return <SpecimenWindow width={1040} height={496}><AvailabilityPicker /></SpecimenWindow>;
    case 'task-inbox': return <SpecimenWindow width={704} height={528}><ToastProvider><TaskInbox /></ToastProvider></SpecimenWindow>;
    case 'settings': return <SpecimenWindow width={832} height={576}><Settings colorway={colorway} /></SpecimenWindow>;
    case 'studio-week': return <SpecimenWindow width={960} height={624}><StudioWeek /></SpecimenWindow>;
    default: return null;
  }
}
