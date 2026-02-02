# Casino Web Application

## Overview
A full-featured casino web application with 10 casino games, player accounts, and an internal currency system using "Diamonds."

## Authentication
- Internet Identity login system for player accounts
- User registration and authentication required to access games

## Currency System
- Internal currency called "Diamonds"
- New players receive 1000 diamonds upon first signup
- All games use diamonds for wagering

## Games (10 Total)
The application includes these casino games:
1. **Slots** - Classic slot machine with spinning reels
2. **Roulette** - European-style roulette wheel
3. **Blackjack** - Standard blackjack card game
4. **Coin Flip** - Simple heads/tails betting
5. **Dice Roll** - Roll dice and bet on outcomes
6. **Wheel Spin** - Fortune wheel with numbered segments
7. **Number Guess** - Guess a random number within range
8. **Card Draw** - Draw cards and bet on suits/values
9. **Jackpot** - Progressive jackpot-style game
10. **Mines** - Grid-based mine avoidance game

All games use randomization logic for fair outcomes and are 2D games with frontend-only game state.

## Internal Wallet
- Display current diamonds balance
- Transaction history showing wins, losses, deposits, and withdrawals
- Deposit functionality to add diamonds
- Withdrawal functionality with restrictions

## Withdrawal Restrictions
- Players must wager their initial 1000 signup bonus diamonds before being eligible to withdraw
- System tracks wagered amounts to enforce this rule

## Game Lobby
- Dashboard showing all available games
- Current diamonds balance display
- Easy navigation to individual games

## Admin Settings
- Settings section for administrators
- Ability to modify the value/exchange rate of diamonds
- Admin controls for game parameters

## Backend Data Storage
The backend stores:
- User accounts and authentication data
- Player diamond balances
- Transaction history (deposits, withdrawals, game wins/losses)
- Wagering history to track bonus requirements
- Admin settings for diamond values
- Game statistics and outcomes

## Backend Operations
- User registration and authentication
- Diamond balance management
- Transaction processing
- Withdrawal eligibility verification
- Game outcome recording
- Admin settings management
