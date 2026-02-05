import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface AppAsset {
    assetId: string;
    blob: ExternalBlob;
    name: string;
    description: string;
    updatedAt: Time;
    assetCategory: string;
}
export interface Symbol {
    id: string;
    name: string;
    updatedAt: Time;
    image: ExternalBlob;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface ThemeConfig {
    primaryColor: string;
    cardGradient: string;
    accentColor: string;
    bgGradient: string;
    surfaceGradient: string;
    navigationGradient: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface Transaction {
    transactionType: string;
    timestamp: Time;
    gameType?: string;
    balanceAfter: bigint;
    amount: bigint;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface GameCatalogEntry {
    title: string;
    icon: ExternalBlob;
    gameId: string;
    description: string;
    updatedAt: Time;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface GameOutcome {
    betAmount: bigint;
    winAmount: bigint;
    timestamp: Time;
    gameType: string;
    isWin: boolean;
}
export interface CasinoSettings {
    houseEdgePercentage: bigint;
    minDeposit: bigint;
    minWithdrawal: bigint;
    dealerUsername: string;
    currencyName: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface BannerConfig {
    height: bigint;
    backgroundColor: string;
    objectFit: string;
    enabled: boolean;
    updatedAt: Time;
    destinationUrl: string;
    bannerImage?: ExternalBlob;
    padding: bigint;
}
export interface GameSymbolSet {
    cards: Array<Symbol>;
    dice: Array<Symbol>;
    slots: Array<Symbol>;
    wheel: Array<Symbol>;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface SiteBranding {
    displayName: string;
}
export interface UserProfile {
    lastLoginTime: Time;
    username: string;
    totalLosses: bigint;
    maxStreak: bigint;
    diamondsLost: bigint;
    totalGamesPlayed: bigint;
    diamondsWon: bigint;
    totalWins: bigint;
    totalDiamondsBet: bigint;
    totalDiamondsWon: bigint;
    diamondsWagered: bigint;
    fastestGameTime: bigint;
    hasCompletedWageringRequirement: boolean;
    diamondBalance: bigint;
    registrationTime: Time;
    currentStreak: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addGameCatalogEntry(entry: GameCatalogEntry): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteAsset(assetId: string): Promise<void>;
    deposit(amount: bigint): Promise<void>;
    getAllAssets(): Promise<Array<AppAsset>>;
    getAllGameCatalogEntries(): Promise<Array<GameCatalogEntry>>;
    getAllUsers(): Promise<Array<[Principal, UserProfile]>>;
    getAsset(assetId: string): Promise<AppAsset | null>;
    getBalance(): Promise<bigint>;
    getBannerConfig(): Promise<BannerConfig | null>;
    getBranding(): Promise<SiteBranding>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCasinoSettings(): Promise<CasinoSettings>;
    getGameCatalogEntry(gameId: string): Promise<GameCatalogEntry | null>;
    getGameHistory(): Promise<Array<GameOutcome>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getSymbolSet(gameType: string): Promise<GameSymbolSet>;
    getThemeConfig(): Promise<ThemeConfig | null>;
    getTopPlayers(): Promise<Array<UserProfile>>;
    getTopPlayersByStreak(): Promise<Array<UserProfile>>;
    getTopPlayersByWins(): Promise<Array<UserProfile>>;
    getTotalUsers(): Promise<bigint>;
    getTransactionHistory(): Promise<Array<Transaction>>;
    getTransactionHistoryForUser(user: Principal): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasCompletedWageringRequirement(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    isUserEligibleForWithdrawal(): Promise<boolean>;
    recordGameOutcome(gameType: string, betAmount: bigint, winAmount: bigint, isWin: boolean): Promise<void>;
    registerUser(username: string): Promise<void>;
    removeGameCatalogEntry(gameId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setBannerConfig(newBannerConfig: BannerConfig): Promise<void>;
    setCurrencyName(name: string): Promise<void>;
    setDealerUsername(username: string): Promise<void>;
    setHouseEdge(percentage: bigint): Promise<void>;
    setMinDeposit(amount: bigint): Promise<void>;
    setMinWithdrawal(amount: bigint): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    setThemeConfig(newThemeConfig: ThemeConfig): Promise<void>;
    storeAsset(asset: AppAsset): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateAsset(assetId: string, updatedAsset: AppAsset): Promise<void>;
    updateBranding(newBranding: SiteBranding): Promise<void>;
    updateCasinoSettings(settings: CasinoSettings): Promise<void>;
    updateGameCatalogEntry(gameId: string, entry: GameCatalogEntry): Promise<void>;
    updateSymbolSet(gameType: string, symbolSet: GameSymbolSet): Promise<void>;
    updateWageredAmount(amount: bigint): Promise<void>;
    withdraw(amount: bigint): Promise<void>;
}
