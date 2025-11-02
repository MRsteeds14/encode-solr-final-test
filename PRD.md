# SOLR-ARC Platform - Product Requirements Document

SOLR-ARC is an AI-powered platform that tokenizes solar energy generation, enabling producers to earn sARC tokens (1 kWh = 1 sARC) redeemable for USDC on the Arc blockchain.

**Experience Qualities**:
1. **Trustworthy** - The interface communicates security and reliability through clean design and clear status indicators for AI agent processing
2. **Empowering** - Users feel in control with real-time visibility into their energy tokenization and redemption processes
3. **Modern** - Cutting-edge visual design that reflects the innovative nature of blockchain-based renewable energy

**Complexity Level**: Light Application (multiple features with basic state)
This is a demo-ready application showcasing energy tokenization with simulated wallet integration, AI agent processing visualization, and token redemption flows. State management via useKV enables persistent user data across sessions.

## Essential Features

### 1. Dashboard Overview
- **Functionality**: Central hub displaying producer statistics, token balances, energy generation charts, and recent transactions
- **Purpose**: Provide at-a-glance insight into the producer's entire energy tokenization ecosystem
- **Trigger**: User navigates to the main view after wallet connection
- **Progression**: View stats cards → Analyze generation chart → Review recent transactions → Access quick actions
- **Success Criteria**: All data loads within 1 second; charts are interactive and responsive; stats update in real-time

### 2. Energy Input Simulator
- **Functionality**: Form for submitting daily kWh generation data that triggers the AI agent minting process
- **Purpose**: Demonstrate the energy-to-token conversion flow for hackathon judges
- **Trigger**: User clicks "Submit Energy" from dashboard or navigates to minting interface
- **Progression**: Enter kWh amount → Submit → Watch AI agents validate (Risk Agent → PoG Agent) → View minting progress → Receive confirmation
- **Success Criteria**: Form validates input (0-100 kWh range); AI agent status shows sequential processing; tokens are minted to user's balance

### 3. AI Agent Processing Visualization
- **Functionality**: Real-time status display of Risk Agent and Proof-of-Generation Agent working sequentially
- **Purpose**: Build trust by showing the automated validation and minting pipeline
- **Trigger**: Automatically displays when energy submission is processed
- **Progression**: Risk Agent analyzing → Risk Agent approved ✓ → PoG Agent processing → PoG Agent minting → IPFS proof generated → Transaction confirmed
- **Success Criteria**: Each agent shows distinct loading/success states; processing takes 3-5 seconds for realism; IPFS hash is generated and displayed

### 4. Token Redemption Interface
- **Functionality**: Convert sARC tokens to USDC with real-time rate calculation
- **Purpose**: Complete the value loop by enabling producers to realize monetary value from their energy
- **Trigger**: User clicks "Redeem" from dashboard or navigation
- **Progression**: View current balance → Enter sARC amount → See USDC equivalent → Confirm redemption → Transaction processes → Balance updates
- **Success Criteria**: Calculator updates in real-time; shows exchange rate (1 sARC = 0.10 USDC); transaction completes with animation

### 5. Wallet Connection UI
- **Functionality**: Simulated wallet connection showing Arc Testnet network with address display
- **Purpose**: Demonstrate Web3 UX without requiring actual blockchain connection for demo
- **Trigger**: User clicks "Connect Wallet" button
- **Progression**: Click connect → Modal appears → Select wallet → Shows connected state with address and network badge
- **Success Criteria**: Displays shortened wallet address (0x1234...5678); shows Arc Testnet network; persists connection state

### 6. Live Transaction Feed
- **Functionality**: Real-time activity log showing all minting and redemption events
- **Purpose**: Provide transparency and system activity awareness
- **Trigger**: Automatically populates with user's historical transactions
- **Progression**: View recent activity → Click transaction for details → See full transaction hash and IPFS proof link
- **Success Criteria**: Shows last 10 transactions; updates immediately after new mint/redeem; includes timestamps and amounts

### 7. Producer Profile Stats
- **Functionality**: Display system capacity, daily generation cap, and lifetime totals
- **Purpose**: Give context to the producer's scale and performance within the platform
- **Trigger**: Always visible in dashboard header or stats section
- **Progression**: View system capacity (kW) → See daily cap (kWh) → Review total generated (kWh) → Check total earned (USDC)
- **Success Criteria**: Stats are persistent; update after each mint; display with appropriate units and formatting

## Edge Case Handling
- **Excessive Energy Input**: Input field capped at daily limit (100 kWh); shows warning if attempting to exceed producer's capacity
- **Insufficient Balance**: Redemption button disabled when sARC balance is zero; shows helpful message
- **Network Disconnection**: Graceful UI state showing "reconnecting" without breaking the app
- **Duplicate Submissions**: Submit button disabled during processing to prevent double-minting
- **Invalid Data**: Form validation prevents negative numbers, decimals beyond 2 places, and non-numeric input

## Design Direction
The design should evoke **cutting-edge innovation and trust through futuristic aesthetics**, feeling modern, sophisticated, and Web3-native. The interface embraces a dark theme with glowing neon accents inspired by modern fintech platforms, featuring glassmorphism effects, ambient particle animations, and purposeful use of blur and glow to create depth. It should communicate **technological sophistication** while remaining approachable, with smooth animations and interactive elements that reward user engagement.

## Color Selection
**Triadic + Neon accent scheme** balancing blockchain technology (purple/blue), energy (primary teal), and value (pink/magenta), creating a futuristic cyberpunk-inspired palette.

- **Primary Color**: Electric Purple `oklch(0.65 0.25 265)` - Represents blockchain technology, innovation, and digital transformation
- **Secondary Colors**: Cyan Blue `oklch(0.55 0.20 210)` for AI/automation elements; Deep Space `oklch(0.08 0.02 265)` for backgrounds
- **Accent Color**: Neon Pink `oklch(0.70 0.18 330)` - Highlights USDC earnings and rewards, creates energy and excitement
- **Foreground/Background Pairings**:
  - Background (Deep Space `oklch(0.08 0.02 265)`): Light foreground `oklch(0.98 0 0)` - Ratio 15.8:1 ✓
  - Card (Dark Purple `oklch(0.12 0.03 265)`): Light foreground `oklch(0.98 0 0)` - Ratio 13.2:1 ✓
  - Primary (Electric Purple): White text `oklch(1 0 0)` - Ratio 5.1:1 ✓
  - Secondary (Cyan Blue): White text `oklch(1 0 0)` - Ratio 5.8:1 ✓
  - Accent (Neon Pink): White text `oklch(1 0 0)` - Ratio 4.7:1 ✓
  - Muted (Charcoal `oklch(0.18 0.02 265)`): Light muted foreground `oklch(0.65 0.02 265)` - Ratio 5.2:1 ✓

## Font Selection
Typefaces should convey **sleek modernity and precision**, balancing cutting-edge technology with readability. Using **Inter** for its geometric clarity and tech-forward personality, paired with **JetBrains Mono** for technical elements to maintain authenticity.

- **Typographic Hierarchy**:
  - H1 (Hero Title): Inter Bold / 56px / -0.03em tracking / Leading 1.1 / Gradient text effect
  - H2 (Section Header): Inter Semibold / 28px / -0.02em tracking / Leading 1.2 / Gradient accent
  - H3 (Card Title): Inter Semibold / 18px / Normal tracking / Leading 1.4
  - Body (Main Text): Inter Regular / 16px / Normal tracking / Leading 1.6
  - Small (Metadata): Inter Medium / 14px / Normal tracking / Leading 1.5
  - Code (Addresses): JetBrains Mono Regular / 14px / Normal tracking / Monospace

## Animations
Animations should **create a sense of digital energy and responsiveness**, with glowing effects, smooth transitions, and ambient background motion. Motion feels **fluid and physics-based** with purposeful use of glow/blur effects to enhance the futuristic aesthetic. Celebrate key moments (minting completion, successful redemption) with satisfying visual feedback.

- **Purposeful Meaning**: Glowing animations indicate active processing, pulsing effects draw attention to important state changes, particle effects create ambient energy
- **Hierarchy of Movement**: 
  - Critical: Agent status transitions (300ms spring + glow), token minting success (500ms with glow burst)
  - Secondary: Card hover lift (200ms) with glow intensification, chart animations (600ms ease-in-out)
  - Tertiary: Button interactions (150ms) with subtle glow, icon hover effects (200ms)
  - Ambient: Background particle animations (continuous low opacity)

## Component Selection
- **Components**: 
  - `Card` for dashboard stats, transaction items, and form containers with custom gradient borders
  - `Button` (primary variant for minting/redeem, outline for secondary actions) with loading states
  - `Input` for energy amount and redemption quantity with validation styling
  - `Badge` for wallet network status, agent status indicators, and transaction types
  - `Progress` for AI agent processing steps and minting completion
  - `Dialog` for wallet connection modal and transaction confirmations
  - `Tabs` for switching between dashboard views (Overview, Activity, Profile)
  - `Separator` to divide dashboard sections
  - Custom chart component using Recharts for energy generation over time

- **Customizations**: 
  - Custom `StatsCard` combining Card with animated counter for token balances
  - Custom `AgentStatusIndicator` showing sequential processing pipeline with icons
  - Custom `TransactionRow` with expandable details and IPFS link
  - Custom `WalletButton` that adapts between "Connect" and connected state with avatar

- **States**: 
  - Buttons: Default (solid with shadow), Hover (lift 2px + glow), Active (pressed scale 0.98), Loading (spinner + disabled), Disabled (opacity 50%)
  - Inputs: Default (border-muted), Focus (border-primary + ring), Error (border-destructive + shake animation), Success (border-emerald + checkmark)
  - Cards: Rest (subtle border), Hover (lift 4px + shadow-lg for interactive cards)

- **Icon Selection**: 
  - Energy/Solar: `Sun`, `Lightning` (Phosphor Icons)
  - Tokens/Currency: `Coins`, `CurrencyCircleDollar`
  - Blockchain: `Link`, `CheckCircle`, `WarningCircle`
  - AI Agents: `Robot`, `ShieldCheck`, `FileText`
  - Navigation: `ChartLine`, `ArrowsLeftRight`, `UserCircle`
  - Actions: `Plus`, `ArrowRight`, `Copy`

- **Spacing**: 
  - Consistent 4px base unit: Tight spacing (8px), Default (16px), Relaxed (24px), Loose (32px)
  - Dashboard grid: 24px gap between cards
  - Form fields: 12px vertical gap
  - Section margins: 40px vertical separation

- **Mobile**: 
  - Dashboard cards stack vertically on <768px
  - Stats grid: 2 columns on tablet (768-1024px), 1 column on mobile (<768px)
  - Navigation tabs become horizontal scroll on mobile
  - Transaction feed shows condensed view with expandable rows
  - Energy input form maintains full width with larger touch targets (min 44px)
  - Charts reduce height and adjust tick labels for readability
