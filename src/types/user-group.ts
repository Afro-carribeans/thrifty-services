import { IUser } from './index';
export interface IUserGroup {
  id: string;
  name: string;
  description?: string;
  creator: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  user?: IUser;
}

export type CreateUserGroupDto = Omit<IUserGroup, 'id' | 'createdAt' | 'updatedAt' | 'user'>;
export type UpdateUserGroupDto = Partial<CreateUserGroupDto>;