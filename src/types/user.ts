import { IUserGroup, ILoan, IPayment, IContribution, IReferral, IProfitShare, IRepayment, STATUS, ROLES } from './index';

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface IBankInfo {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  iban?: string;
}

export interface IMemberOf {
  cooperativeId: string;
  role: string;
  joinedAt: Date;
}

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  password: string;
  address: Record<string, any>; 
  email: string;
  phone: string;
  profileImg: string;
  memberOf: Record<string, any>; 
  status: STATUS;
  verified: boolean;
  termAccepted: boolean;
  authenticatorId: string;
  bankInfo: Record<string, any>;
  archived: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  groups?: IUserGroup[];
  contributions?: IContribution[];
  loans?: ILoan[];
  payments?: IPayment[];
  repayments?: IRepayment[];
  Referral?: IReferral[];
  ProfitShare?: IProfitShare[];
}

export type CreateUserDto = Omit<IUser, 
  'id' | 'createdAt' | 'updatedAt' | 'groups' | 'contributions' | 'loans' | 'payments' | 'repayments' | 'Referral' | 'ProfitShare' | 'archived' | 'deleted'
>;
export type UpdateUserDto = Partial<CreateUserDto>;