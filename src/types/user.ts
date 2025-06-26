import { IUserGroup, ILoan, IPayment, IContribution, IReferral, IProfitShare, IRepayment } from './index';

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
    address: IAddress;
    email: string;
    phone: string;
    profileImg: string;
    memberOf: IMemberOf[];
    status: string;
    verified: boolean;
    termAccepted: boolean;
    authenticatorId: string;
    bankInfo: IBankInfo;
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

export type CreateUserDto = Omit<IUser, 'id' | 'createdAt' | 'updatedAt' | 'groups' | 'contributions' | 'loans' | 'payments' | 'repayments' | 'Referral' | 'ProfitShare'>;
export type UpdateUserDto = Partial<CreateUserDto>;