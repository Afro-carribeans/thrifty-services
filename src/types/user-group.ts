import { IUser, ROLES } from './index';

export interface IUserGroup {
  id: string;
  name: string;
  description?: string;
  creator: string;
  role: ROLES;
  archived: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: IUser;
}

export type CreateUserGroupDto = Omit<IUserGroup, 
  'id' | 'createdAt' | 'updatedAt' | 'user' | 'archived' | 'deleted'
>;
export type UpdateUserGroupDto = Partial<CreateUserGroupDto>;