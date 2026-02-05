import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import Storage "blob-storage/Storage";
import Iter "mo:core/Iter";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";



actor {
  public type SiteBranding = { displayName : Text };

  var siteBranding : SiteBranding = { displayName = "Diamond Casino" };

  public type ThemeConfig = {
    primaryColor : Text;
    accentColor : Text;
    bgGradient : Text;
    surfaceGradient : Text;
    navigationGradient : Text;
    cardGradient : Text;
  };

  public type BannerConfig = {
    enabled : Bool;
    bannerImage : ?Storage.ExternalBlob;
    destinationUrl : Text;
    height : Nat;
    padding : Nat;
    backgroundColor : Text;
    objectFit : Text;
    updatedAt : Time.Time;
  };

  var themeConfig : ?ThemeConfig = null;
  var bannerConfig : ?BannerConfig = null;

  public type AppAsset = {
    assetId : Text;
    blob : Storage.ExternalBlob;
    name : Text;
    description : Text;
    assetCategory : Text;
    updatedAt : Time.Time;
  };

  public type UserProfile = {
    username : Text;
    diamondBalance : Nat;
    diamondsWagered : Nat;
    diamondsWon : Nat;
    diamondsLost : Nat;
    registrationTime : Time.Time;
    lastLoginTime : Time.Time;
    hasCompletedWageringRequirement : Bool;
    totalGamesPlayed : Nat;
    totalDiamondsBet : Nat;
    totalDiamondsWon : Nat;
    totalWins : Nat;
    totalLosses : Nat;
    currentStreak : Nat;
    maxStreak : Nat;
    fastestGameTime : Nat;
  };

  public type Transaction = {
    transactionType : Text;
    amount : Nat;
    timestamp : Time.Time;
    balanceAfter : Nat;
    gameType : ?Text;
  };

  public type CasinoSettings = {
    minDeposit : Nat;
    minWithdrawal : Nat;
    houseEdgePercentage : Nat;
    dealerUsername : Text;
    currencyName : Text;
  };

  public type GameOutcome = {
    gameType : Text;
    betAmount : Nat;
    winAmount : Nat;
    timestamp : Time.Time;
    isWin : Bool;
  };

  public type Symbol = {
    id : Text;
    name : Text;
    image : Storage.ExternalBlob;
    updatedAt : Time.Time;
  };

  public type GameSymbolSet = {
    slots : [Symbol];
    dice : [Symbol];
    cards : [Symbol];
    wheel : [Symbol];
  };

  public type GameCatalogEntry = {
    gameId : Text;
    title : Text;
    description : Text;
    icon : Storage.ExternalBlob;
    updatedAt : Time.Time;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let transactionHistory = Map.empty<Principal, [Transaction]>();
  let gameOutcomes = Map.empty<Principal, [GameOutcome]>();
  let gameSymbolSets = Map.empty<Text, GameSymbolSet>();

  let gameCatalog = Map.empty<Text, GameCatalogEntry>();
  let appAssets = Map.empty<Text, AppAsset>();

  var casinoSettings : CasinoSettings = {
    minDeposit = 100;
    minWithdrawal = 100;
    houseEdgePercentage = 5;
    dealerUsername = "House";
    currencyName = "Diamonds";
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  var stripeConfig : ?Stripe.StripeConfiguration = null;
  var stripeConfigLastUpdated : ?Time.Time = null;

  func getDefaultSymbolSet() : GameSymbolSet {
    {
      slots = [];
      dice = [];
      cards = [];
      wheel = [];
    };
  };

  public query ({ caller }) func getSymbolSet(gameType : Text) : async GameSymbolSet {
    switch (gameSymbolSets.get(gameType)) {
      case (?symbolSet) { symbolSet };
      case (null) { getDefaultSymbolSet() };
    };
  };

  public shared ({ caller }) func updateSymbolSet(gameType : Text, symbolSet : GameSymbolSet) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update symbol sets");
    };

    let updatedSymbols = {
      slots = symbolSet.slots.map(
        func(symbol) {
          {
            id = symbol.id;
            name = symbol.name;
            image = symbol.image;
            updatedAt = Time.now();
          };
        }
      );
      dice = symbolSet.dice.map(
        func(symbol) {
          {
            id = symbol.id;
            name = symbol.name;
            image = symbol.image;
            updatedAt = Time.now();
          };
        }
      );
      cards = symbolSet.cards.map(
        func(symbol) {
          {
            id = symbol.id;
            name = symbol.name;
            image = symbol.image;
            updatedAt = Time.now();
          };
        }
      );
      wheel = symbolSet.wheel.map(
        func(symbol) {
          {
            id = symbol.id;
            name = symbol.name;
            image = symbol.image;
            updatedAt = Time.now();
          };
        }
      );
    };

    gameSymbolSets.add(gameType, updatedSymbols);
  };

  public shared ({ caller }) func addGameCatalogEntry(entry : GameCatalogEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add game catalog entries");
    };

    gameCatalog.add(entry.gameId, entry);
  };

  public shared ({ caller }) func updateGameCatalogEntry(gameId : Text, entry : GameCatalogEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update game catalog entries");
    };

    if (not gameCatalog.containsKey(gameId)) {
      Runtime.trap("Game catalog entry not found");
    };

    gameCatalog.add(gameId, entry);
  };

  public shared ({ caller }) func removeGameCatalogEntry(gameId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can remove game catalog entries");
    };

    if (not gameCatalog.containsKey(gameId)) {
      Runtime.trap("Game catalog entry not found");
    };

    gameCatalog.remove(gameId);
  };

  public query ({ caller }) func getAllGameCatalogEntries() : async [GameCatalogEntry] {
    gameCatalog.values().toArray();
  };

  public query ({ caller }) func getGameCatalogEntry(gameId : Text) : async ?GameCatalogEntry {
    gameCatalog.get(gameId);
  };

  public query ({ caller }) func isStripeConfigured() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can check Stripe configuration status");
    };
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfig := ?config;
    stripeConfigLastUpdated := ?Time.now();
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check session status");
    };
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe configuration not set") };
      case (?config) { await Stripe.getSessionStatus(config, sessionId, transform) };
    };
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe configuration not set") };
      case (?config) {
        await Stripe.createCheckoutSession(config, caller, items, successUrl, cancelUrl, transform);
      };
    };
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile or admin can view all");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let updatedProfile = {
      profile with
      lastLoginTime = Time.now();
    };
    userProfiles.add(caller, updatedProfile);
  };

  public shared ({ caller }) func registerUser(username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register");
    };

    switch (userProfiles.get(caller)) {
      case (?_) {
        Runtime.trap("User already registered");
      };
      case (null) {
        let now = Time.now();
        let newProfile : UserProfile = {
          username = username;
          diamondBalance = 1000;
          diamondsWagered = 0;
          diamondsWon = 0;
          diamondsLost = 0;
          registrationTime = now;
          lastLoginTime = now;
          hasCompletedWageringRequirement = false;
          totalGamesPlayed = 0;
          totalDiamondsBet = 0;
          totalDiamondsWon = 0;
          totalWins = 0;
          totalLosses = 0;
          currentStreak = 0;
          maxStreak = 0;
          fastestGameTime = 0;
        };
        userProfiles.add(caller, newProfile);

        let transaction : Transaction = {
          transactionType = "signup_bonus";
          amount = 1000;
          timestamp = now;
          balanceAfter = 1000;
          gameType = null;
        };
        transactionHistory.add(caller, [transaction]);
      };
    };
  };

  public query ({ caller }) func hasCompletedWageringRequirement() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check wagering requirements");
    };

    switch (userProfiles.get(caller)) {
      case (?profile) { profile.hasCompletedWageringRequirement };
      case (null) { false };
    };
  };

  public shared ({ caller }) func updateWageredAmount(amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update wagered amounts");
    };

    switch (userProfiles.get(caller)) {
      case (?existingProfile) {
        let newWageredAmount = existingProfile.diamondsWagered + amount;
        let hasCompleted = newWageredAmount >= 1000;

        let updatedProfile : UserProfile = {
          existingProfile with
          diamondsWagered = newWageredAmount;
          hasCompletedWageringRequirement = hasCompleted;
        };
        userProfiles.add(caller, updatedProfile);
      };
      case (null) {
        Runtime.trap("User profile not found");
      };
    };
  };

  public query ({ caller }) func isUserEligibleForWithdrawal() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check withdrawal eligibility");
    };

    switch (userProfiles.get(caller)) {
      case (?profile) {
        profile.hasCompletedWageringRequirement and profile.diamondBalance >= casinoSettings.minWithdrawal;
      };
      case (null) { false };
    };
  };

  public shared ({ caller }) func deposit(amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can deposit");
    };

    if (amount < casinoSettings.minDeposit) {
      Runtime.trap("Deposit amount below minimum");
    };

    switch (userProfiles.get(caller)) {
      case (?profile) {
        let newBalance = profile.diamondBalance + amount;
        let updatedProfile = {
          profile with
          diamondBalance = newBalance;
        };
        userProfiles.add(caller, updatedProfile);

        addTransaction(caller, {
          transactionType = "deposit";
          amount = amount;
          timestamp = Time.now();
          balanceAfter = newBalance;
          gameType = null;
        });
      };
      case (null) {
        Runtime.trap("User profile not found");
      };
    };
  };

  public shared ({ caller }) func withdraw(amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can withdraw");
    };

    if (amount < casinoSettings.minWithdrawal) {
      Runtime.trap("Withdrawal amount below minimum");
    };

    switch (userProfiles.get(caller)) {
      case (?profile) {
        if (not profile.hasCompletedWageringRequirement) {
          Runtime.trap("Must complete wagering requirement before withdrawal");
        };

        if (profile.diamondBalance < amount) {
          Runtime.trap("Insufficient balance");
        };

        let newBalance = profile.diamondBalance - amount;
        let updatedProfile = {
          profile with
          diamondBalance = newBalance;
        };
        userProfiles.add(caller, updatedProfile);

        addTransaction(caller, {
          transactionType = "withdrawal";
          amount = amount;
          timestamp = Time.now();
          balanceAfter = newBalance;
          gameType = null;
        });
      };
      case (null) {
        Runtime.trap("User profile not found");
      };
    };
  };

  public query ({ caller }) func getBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check balance");
    };

    switch (userProfiles.get(caller)) {
      case (?profile) { profile.diamondBalance };
      case (null) { 0 };
    };
  };

  func addTransaction(user : Principal, transaction : Transaction) {
    switch (transactionHistory.get(user)) {
      case (?history) {
        let newHistory = history.concat([transaction]);
        transactionHistory.add(user, newHistory);
      };
      case (null) {
        transactionHistory.add(user, [transaction]);
      };
    };
  };

  public query ({ caller }) func getTransactionHistory() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transaction history");
    };

    switch (transactionHistory.get(caller)) {
      case (?history) { history };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getTransactionHistoryForUser(user : Principal) : async [Transaction] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view other users' transactions");
    };

    switch (transactionHistory.get(user)) {
      case (?history) { history };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func recordGameOutcome(
    gameType : Text,
    betAmount : Nat,
    winAmount : Nat,
    isWin : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record game outcomes");
    };

    switch (userProfiles.get(caller)) {
      case (?profile) {
        var newBalance = profile.diamondBalance;
        if (isWin) {
          newBalance := newBalance + winAmount;
        } else {
          if (profile.diamondBalance < betAmount) {
            Runtime.trap("Insufficient balance for bet");
          };
          newBalance := newBalance - betAmount;
        };

        let newWageredAmount = profile.diamondsWagered + betAmount;
        let hasCompleted = newWageredAmount >= 1000;

        var newCurrentStreak = profile.currentStreak;
        var newMaxStreak = profile.maxStreak;
        if (isWin) {
          newCurrentStreak := newCurrentStreak + 1;
          if (newCurrentStreak > newMaxStreak) {
            newMaxStreak := newCurrentStreak;
          };
        } else {
          newCurrentStreak := 0;
        };

        let updatedProfile = {
          profile with
          diamondBalance = newBalance;
          diamondsWagered = newWageredAmount;
          hasCompletedWageringRequirement = hasCompleted;
          diamondsWon = if (isWin) { profile.diamondsWon + winAmount } else { profile.diamondsWon };
          diamondsLost = if (not isWin) { profile.diamondsLost + betAmount } else { profile.diamondsLost };
          totalGamesPlayed = profile.totalGamesPlayed + 1;
          totalDiamondsBet = profile.totalDiamondsBet + betAmount;
          totalDiamondsWon = if (isWin) { profile.totalDiamondsWon + winAmount } else { profile.totalDiamondsWon };
          totalWins = if (isWin) { profile.totalWins + 1 } else { profile.totalWins };
          totalLosses = if (not isWin) { profile.totalLosses + 1 } else { profile.totalLosses };
          currentStreak = newCurrentStreak;
          maxStreak = newMaxStreak;
        };
        userProfiles.add(caller, updatedProfile);

        addTransaction(caller, {
          transactionType = if (isWin) { "game_win" } else { "game_loss" };
          amount = if (isWin) { winAmount } else { betAmount };
          timestamp = Time.now();
          balanceAfter = newBalance;
          gameType = ?gameType;
        });

        let outcome : GameOutcome = {
          gameType = gameType;
          betAmount = betAmount;
          winAmount = winAmount;
          timestamp = Time.now();
          isWin = isWin;
        };
        switch (gameOutcomes.get(caller)) {
          case (?outcomes) {
            let newOutcomes = outcomes.concat([outcome]);
            gameOutcomes.add(caller, newOutcomes);
          };
          case (null) {
            gameOutcomes.add(caller, [outcome]);
          };
        };
      };
      case (null) {
        Runtime.trap("User profile not found");
      };
    };
  };

  public query ({ caller }) func getGameHistory() : async [GameOutcome] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view game history");
    };

    switch (gameOutcomes.get(caller)) {
      case (?outcomes) { outcomes };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getTopPlayers() : async [UserProfile] {
    let userList = userProfiles.entries().toArray();

    let sorted = userList.sort(
      func((_, u1) : (Principal, UserProfile), (_, u2) : (Principal, UserProfile)) : Order.Order {
        Nat.compare(u2.diamondBalance, u1.diamondBalance);
      }
    );

    let onlyUsers = sorted.map(
      func((_, user)) { user }
    );

    let topTen = onlyUsers.sliceToArray(0, Nat.min(onlyUsers.size(), 10));
    topTen;
  };

  public query ({ caller }) func getTopPlayersByWins() : async [UserProfile] {
    let userList = userProfiles.entries().toArray();

    let sorted = userList.sort(
      func((_, u1) : (Principal, UserProfile), (_, u2) : (Principal, UserProfile)) : Order.Order {
        Nat.compare(u2.totalWins, u1.totalWins);
      }
    );

    let onlyUsers = sorted.map(
      func((_, user)) { user }
    );

    let topTen = onlyUsers.sliceToArray(0, Nat.min(onlyUsers.size(), 10));
    topTen;
  };

  public query ({ caller }) func getTopPlayersByStreak() : async [UserProfile] {
    let userList = userProfiles.entries().toArray();

    let sorted = userList.sort(
      func((_, u1) : (Principal, UserProfile), (_, u2) : (Principal, UserProfile)) : Order.Order {
        Nat.compare(u2.maxStreak, u1.maxStreak);
      }
    );

    let onlyUsers = sorted.map(
      func((_, user)) { user }
    );

    let topTen = onlyUsers.sliceToArray(0, Nat.min(onlyUsers.size(), 10));
    topTen;
  };

  public shared ({ caller }) func updateCasinoSettings(settings : CasinoSettings) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update casino settings");
    };
    casinoSettings := settings;
  };

  public query ({ caller }) func getCasinoSettings() : async CasinoSettings {
    casinoSettings;
  };

  public shared ({ caller }) func setMinDeposit(amount : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set minimum deposit");
    };
    casinoSettings := {
      casinoSettings with
      minDeposit = amount;
    };
  };

  public shared ({ caller }) func setMinWithdrawal(amount : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set minimum withdrawal");
    };
    casinoSettings := {
      casinoSettings with
      minWithdrawal = amount;
    };
  };

  public shared ({ caller }) func setHouseEdge(percentage : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set house edge");
    };
    if (percentage > 100) {
      Runtime.trap("House edge percentage must be between 0 and 100");
    };
    casinoSettings := {
      casinoSettings with
      houseEdgePercentage = percentage;
    };
  };

  public shared ({ caller }) func setDealerUsername(username : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set dealer username");
    };
    casinoSettings := {
      casinoSettings with
      dealerUsername = username;
    };
  };

  public shared ({ caller }) func setCurrencyName(name : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set currency name");
    };
    casinoSettings := {
      casinoSettings with
      currencyName = name;
    };
  };

  public query ({ caller }) func getAllUsers() : async [(Principal, UserProfile)] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    userProfiles.entries().toArray();
  };

  public query ({ caller }) func getTotalUsers() : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view total users");
    };
    userProfiles.size();
  };

  public query ({ caller }) func getBranding() : async SiteBranding {
    siteBranding;
  };

  public shared ({ caller }) func updateBranding(newBranding : SiteBranding) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can update site branding");
    };
    siteBranding := newBranding;
  };

  public query ({ caller }) func getThemeConfig() : async ?ThemeConfig {
    themeConfig;
  };

  public shared ({ caller }) func setThemeConfig(newThemeConfig : ThemeConfig) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can set theme config");
    };
    themeConfig := ?newThemeConfig;
  };

  public query ({ caller }) func getBannerConfig() : async ?BannerConfig {
    bannerConfig;
  };

  public shared ({ caller }) func setBannerConfig(newBannerConfig : BannerConfig) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can set banner config");
    };
    bannerConfig := ?newBannerConfig;
  };

  public shared ({ caller }) func storeAsset(asset : AppAsset) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can store assets");
    };
    appAssets.add(asset.assetId, asset);
  };

  public query ({ caller }) func getAsset(assetId : Text) : async ?AppAsset {
    appAssets.get(assetId);
  };

  public query ({ caller }) func getAllAssets() : async [AppAsset] {
    appAssets.values().toArray();
  };

  public shared ({ caller }) func updateAsset(assetId : Text, updatedAsset : AppAsset) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can update assets");
    };

    switch (appAssets.get(assetId)) {
      case (null) { Runtime.trap("Asset not found") };
      case (?_) {
        appAssets.add(assetId, updatedAsset);
      };
    };
  };

  public shared ({ caller }) func deleteAsset(assetId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can delete assets");
    };
    if (not appAssets.containsKey(assetId)) {
      Runtime.trap("Asset not found");
    };
    appAssets.remove(assetId);
  };
};
