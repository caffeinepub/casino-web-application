import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransactionLogSearchModifier {
    transactionFilter?: TransactionFilter;
    count: bigint;
    offset: bigint;
    searchText: string;
}
export interface GameTransaction {
    id: bigint;
    transactionType: GameTransactionType;
    user: Principal;
    description: string;
    timestamp: Time;
}
export interface GameStats {
    wins: bigint;
    losses: bigint;
    totalBet: bigint;
    totalWin: bigint;
    spins: bigint;
}
export type Time = bigint;
export interface CasinoStats {
    totalGamesPlayed: bigint;
    totalWagers: bigint;
    totalDiamondsBet: bigint;
    totalDiamondsWon: bigint;
    activeGameSessions: bigint;
}
export interface CasinoSettings {
    minDeposit: bigint;
    ownerPercentage: number;
    dealerUserName: string;
    minWithdrawal: bigint;
    currencyName: string;
}
export interface TransactionLog {
    log: GameTransaction;
}
export interface UserSettings {
    notificationsEnabled: boolean;
    username: string;
}
export type GameTransactionType = {
    __kind__: "deposit";
    deposit: bigint;
} | {
    __kind__: "withdrawal";
    withdrawal: bigint;
} | {
    __kind__: "spinOutcome";
    spinOutcome: {
        betAmount: bigint;
        winAmount: bigint;
    };
};
export interface UserProfile {
    username: string;
    balance: bigint;
    signupBonus: bigint;
    totalWagered: bigint;
    registrationTime: Time;
}
export enum TransactionFilter {
    all = "all",
    wins = "wins",
    losses = "losses",
    withdrawals = "withdrawals",
    deposits = "deposits"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createUserSettings(settings: UserSettings): Promise<void>;
    filterTransactionLog(filter: TransactionLogSearchModifier): Promise<Array<TransactionLog>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCasinoSettings(): Promise<CasinoSettings | null>;
    getCasinoStats(): Promise<CasinoStats>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    processPayout(amount: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateCasinoSettings(settings: CasinoSettings): Promise<void>;
    updateGameStats(stats: GameStats): Promise<void>;
}
