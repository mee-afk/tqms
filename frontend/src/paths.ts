import type { Group } from './model';
export const paths: Record<Group, string> = {
  owners: '/admin/vehicle/owner',
  vehicles: '/admin/vehicle',
  others: '/admin/other-vehicles',
  staff: '/admin/checkpoints/staff',
  narrations: '/admin/checkpoints/narrations'
};
