import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Bool "mo:core/Bool";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  module CasinoBackend {
    public type GameTransactionType = {
      #deposit : Nat;
      #withdrawal : Nat;
      #spinOutcome : {
        betAmount : Nat;
        winAmount : Nat;
      };
    };

    public type GameTransaction = {
      id : Nat;
      user : Principal;
      transactionType : GameTransactionType;
      description : Text;
      timestamp : Time.Time;
    };

    public type TransactionLog = {
      log : GameTransaction;
    };

    public type TransactionFilter = {
      #all;
      #wins;
      #losses;
      #deposits;
      #withdrawals;
    };

    public type TransactionLogSearchModifier = {
      transactionFilter : ?TransactionFilter;
      count : Nat;
      offset : Nat;
      searchText : Text;
    };

    module TransactionLog {
      public func compare(log : TransactionLog, other : TransactionLog) : Order.Order {
        Int.compare(log.log.timestamp, other.log.timestamp);
      };
    };

    public type Game = {
      name : Text;
      description : Text;
      multiplier : Float;
    };

    public type CasinoSettings = {
      minDeposit : Nat;
      minWithdrawal : Nat;
      ownerPercentage : Float;
      dealerUserName : Text;
      currencyName : Text;
    };

    public type TopPlayer = {
      username : Text;
      balance : Nat;
      totalWinnings : Nat;
      totalLosses : Nat;
    };

    public type CasinoStats = {
      totalGamesPlayed : Nat;
      totalDiamondsBet : Nat;
      totalDiamondsWon : Nat;
      activeGameSessions : Nat;
      totalWagers : Nat;
    };

    public type UserSettings = {
      username : Text;
      notificationsEnabled : Bool;
    };

    public type GameStats = {
      spins : Nat;
      wins : Nat;
      losses : Nat;
      totalBet : Nat;
      totalWin : Nat;
    };
  };

  // Initialize access control state properly
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profile type
  public type UserProfile = {
    username : Text;
    balance : Nat;
    totalWagered : Nat;
    signupBonus : Nat;
    registrationTime : Time.Time;
  };

  // User profiles storage
  let userProfiles = Map.empty<Principal, UserProfile>();

  public type GameTransaction = CasinoBackend.GameTransaction;

  let transactionLog = Map.empty<Nat, GameTransaction>();
  var nextTransactionId = 0;

  public type CasinoSettings = CasinoBackend.CasinoSettings;

  var currentSettings : ?CasinoSettings = ?{
    minDeposit = 10;
    minWithdrawal = 50;
    ownerPercentage = 2.0;
    dealerUserName = "CasinoOwner";
    currencyName = "Diamond";
  };

  var allowedSyncUntil : ?Time.Time = null;
  var activeGameSessionCount = 0;

  public type GameTransactionType = CasinoBackend.GameTransactionType;

  public type TransactionLog = CasinoBackend.TransactionLog;

  public type TransactionFilter = CasinoBackend.TransactionFilter;

  public type TransactionLogSearchModifier = CasinoBackend.TransactionLogSearchModifier;

  public type Game = CasinoBackend.Game;

  public type TopPlayer = CasinoBackend.TopPlayer;

  public type CasinoStats = CasinoBackend.CasinoStats;

  public type UserSettings = CasinoBackend.UserSettings;

  public type GameStats = CasinoBackend.GameStats;

  type LogType = {
    #deposit;
    #withdrawal;
    #spinOutcome;
  };

  // Required user profile functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Admin-only function to process payouts
  public shared ({ caller }) func processPayout(amount : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can process payouts");
    };

    let transactionId = nextTransactionId;
    nextTransactionId += 1;

    let payoutTransaction : GameTransaction = {
      id = transactionId;
      user = Principal.fromText("2vxsx-fae");
      timestamp = Time.now();
      transactionType = #withdrawal(amount);
      description = "Payout of " # amount.toText() # " diamonds.";
    };

    transactionLog.add(transactionId, payoutTransaction);
  };

  // User-only function
  public shared ({ caller }) func createUserSettings(settings : UserSettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can create settings");
    };
  };

  // User-only function
  public shared ({ caller }) func updateGameStats(stats : GameStats) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can update stats");
    };
  };

  // User-only function
  public query ({ caller }) func getCasinoStats() : async CasinoStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view stats");
    };
    {
      totalGamesPlayed = transactionLog.size();
      totalDiamondsBet = 10000;
      totalDiamondsWon = 5000;
      activeGameSessions = activeGameSessionCount;
      totalWagers = 5000;
    };
  };

  // User can only see their own transactions, admin can see all
  public query ({ caller }) func filterTransactionLog(filter : TransactionLogSearchModifier) : async [TransactionLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view transaction logs");
    };

    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let allTransactions = transactionLog.toArray();

    // Filter by user ownership unless admin
    let userFilteredTransactions = if (isAdmin) {
      allTransactions;
    } else {
      allTransactions.filter(func((_, transaction)) { transaction.user == caller });
    };

    // Apply additional filters
    let filteredTransactions = switch (filter.transactionFilter) {
      case (?#wins) {
        userFilteredTransactions.filter(func((_, transaction)) {
          switch (transaction.transactionType) {
            case (#spinOutcome(outcome)) { outcome.winAmount > outcome.betAmount };
            case (_) { false };
          };
        });
      };
      case (?#losses) {
        userFilteredTransactions.filter(func((_, transaction)) {
          switch (transaction.transactionType) {
            case (#spinOutcome(outcome)) { outcome.winAmount < outcome.betAmount };
            case (_) { false };
          };
        });
      };
      case (?#deposits) {
        userFilteredTransactions.filter(func((_, transaction)) {
          switch (transaction.transactionType) {
            case (#deposit(_)) { true };
            case (_) { false };
          };
        });
      };
      case (?#withdrawals) {
        userFilteredTransactions.filter(func((_, transaction)) {
          switch (transaction.transactionType) {
            case (#withdrawal(_)) { true };
            case (_) { false };
          };
        });
      };
      case (_) {
        userFilteredTransactions;
      };
    };

    filteredTransactions.values().toArray().map(func(entry) { { log = entry.1 } });
  };

  // Admin-only function to update casino settings
  public shared ({ caller }) func updateCasinoSettings(settings : CasinoSettings) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update casino settings");
    };
    currentSettings := ?settings;
  };

  // Public query for casino settings (anyone can view)
  public query func getCasinoSettings() : async ?CasinoSettings {
    currentSettings;
  };
};
