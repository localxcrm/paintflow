import { Job, TeamMember, Subcontractor } from '@/types';

/**
 * Shared props interface for all job detail tab components
 */
export interface JobTabProps {
  /** The job being edited */
  job: Job;
  /** Callback to update a specific field */
  onFieldChange: (field: keyof Job, value: unknown) => void;
}

/**
 * Props for the Team tab component
 */
export interface JobTeamTabProps extends JobTabProps {
  teamMembers: TeamMember[];
  subcontractors: Subcontractor[];
}

/**
 * Props for the Media tab component
 */
export interface JobMediaTabProps extends JobTabProps {
  onPhotosChange: (photos: Job['photos']) => void;
}
