# Clapback Frontend Design System

## 1. Design direction

Clapback should feel like a premium social product built for creators, not a crypto dashboard, gaming app, or generic hackathon interface.

The visual language combines:

- Tinder's direct card interaction and decisive actions;
- Bumble's warmth, friendliness, and generous composition;
- Instagram's content-first chrome and familiar navigation;
- TikTok's confidence around full-bleed media and simple controls;
- editorial product photography and restrained luxury-commerce spacing.

The interface should be **classy, calm, tactile, and clear**. It should not be neon, glossy, overly gradient-heavy, crowded, or aggressively futuristic.

### Product personality

- Confident, not loud.
- Warm, not childish.
- Premium, not exclusive.
- Fast, not rushed.
- Playful through interaction, not decoration.
- Trustworthy around money, eligibility, and Submission state.

### Core UX principles

1. **One primary decision per screen.** The user should always understand the next action.
2. **Content gets the visual weight.** Brand art, Deliverables, and payout matter more than navigation chrome.
3. **Motion explains state.** Swipes, sheets, upload progress, and status transitions should show cause and effect.
4. **Backend truth is visible.** ClapScore, eligibility, Submission status, and payout are displayed exactly as returned.
5. **Demo resilience is part of the design.** Every network or processing state needs a graceful, intentional UI.
6. **Accessibility is not optional.** Gesture actions always have visible button equivalents.

## 2. Brand foundations

### Name treatment

- Product name: **Clapback**.
- Wordmark casing: `Clapback`, never all caps in primary branding.
- Tone line: **Create. Compete. Get picked.**
- The wordmark should rely on strong typography and spacing rather than a complex logo for the prototype.

### Logo mark concept

Use a compact two-part mark made from overlapping rounded speech/card shapes. It represents:

- creator and brand exchange;
- stacked Bounty cards;
- audience response;
- the moment a Submission gets picked.

For the first implementation, use a simple rounded square containing two offset arcs or a bold `C`. Do not block app development on a final vector identity.

## 3. Color system

The palette is warm-neutral with one human accent and one trust accent.

### Foundation colors

| Token | Value | Use |
|---|---:|---|
| `canvas` | `#F5F2EC` | Main app background |
| `surface` | `#FFFCF8` | Cards, sheets, elevated controls |
| `surfaceRaised` | `#FFFFFF` | High-emphasis floating elements |
| `ink` | `#181816` | Primary text and strong controls |
| `inkSoft` | `#494742` | Secondary text |
| `inkMuted` | `#77736C` | Metadata and tertiary labels |
| `border` | `#E5E0D7` | Dividers and outlined controls |
| `borderStrong` | `#CBC4B8` | Selected outlines and focused fields |

### Brand and semantic colors

| Token | Value | Use |
|---|---:|---|
| `coral` | `#D9634C` | Primary action, accepted state, warm highlight |
| `coralPressed` | `#BC4F3B` | Pressed primary control |
| `coralWash` | `#F5DDD7` | Soft primary badge/background |
| `eucalyptus` | `#356B60` | Trust, passed, eligible, positive state |
| `eucalyptusWash` | `#DCEBE6` | Positive status background |
| `amber` | `#A96F2B` | Pending and processing states |
| `amberWash` | `#F4E7D2` | Pending status background |
| `crimson` | `#A4423B` | Failed/error state |
| `crimsonWash` | `#F2DCDA` | Failed/error background |
| `slate` | `#52616B` | Informational status |
| `slateWash` | `#E1E7EA` | Informational background |

### Dark media overlay colors

| Token | Value | Use |
|---|---:|---|
| `mediaScrimTop` | `rgba(16,16,14,0.05)` | Top image/video overlay |
| `mediaScrimBottom` | `rgba(16,16,14,0.78)` | Text legibility over media |
| `mediaChrome` | `#FFFFFF` | Controls over video |

### Color rules

- Use Coral for the single primary action, not every interactive element.
- Use Eucalyptus for trust and successful backend states, not as a competing brand primary.
- Never combine multiple saturated gradients in one screen.
- Gradients may appear inside Bounty artwork, but use adjacent, muted tones.
- Body copy always meets WCAG AA contrast.
- Never communicate status by color alone; pair color with icon and text.

## 4. Typography

Use **DM Sans** as the product typeface when loaded. Fall back to the platform system sans-serif while fonts initialize.

Why DM Sans:

- clean and social-native;
- distinctive without feeling editorially precious;
- highly legible at compact mobile sizes;
- strong numerals for follower counts, payout, and Scoreboard values.

### Type scale

| Style | Size / line | Weight | Tracking | Use |
|---|---|---:|---:|---|
| `display` | 44 / 48 | 700 | `-1.4` | Welcome headline, major result |
| `hero` | 34 / 39 | 700 | `-0.9` | Screen-defining headline |
| `title` | 28 / 34 | 700 | `-0.6` | Primary section title |
| `heading` | 22 / 28 | 700 | `-0.35` | Card/product heading |
| `subheading` | 18 / 24 | 600 | `-0.15` | Sheet and group heading |
| `bodyLarge` | 17 / 25 | 400 | `0` | Intro and prominent body |
| `body` | 15 / 22 | 400 | `0` | Default copy |
| `bodyStrong` | 15 / 22 | 600 | `0` | Emphasized body/action row |
| `label` | 13 / 17 | 600 | `0.15` | Inputs, tabs, metadata |
| `caption` | 12 / 16 | 500 | `0.2` | Supporting metadata |
| `eyebrow` | 11 / 14 | 700 | `1.1` | Uppercase category label |
| `numberHero` | 38 / 42 | 700 | `-1` | Payout and Scoreboard number |

### Typography rules

- Use sentence case for headings and buttons.
- Use uppercase only for short eyebrow labels and canonical badges such as `UGC`.
- Keep paragraphs below roughly 65 characters per line on larger layouts.
- Use tabular numerals for progress, payout, ratings, and follower counts where supported.
- Do not use thin font weights over media.

## 5. Spacing and layout

Base spacing unit: **4**.

| Token | Value |
|---|---:|
| `space1` | 4 |
| `space2` | 8 |
| `space3` | 12 |
| `space4` | 16 |
| `space5` | 20 |
| `space6` | 24 |
| `space8` | 32 |
| `space10` | 40 |
| `space12` | 48 |
| `space16` | 64 |

### Mobile layout

- Horizontal screen gutter: 20.
- Compact horizontal gutter: 16.
- Top content breathing room after safe area: 12–20.
- Bottom action area includes safe area plus at least 12.
- Primary readable content width: full width minus 40.
- Bounty card width: viewport minus 32–40.
- Bounty card preferred aspect ratio: approximately 0.72–0.78 width/height.

### Responsive web layout

- Reviewer media remains full viewport.
- Demo Admin uses a centered maximum width of 1280.
- Admin content grid collapses to one column below tablet width.
- Avoid tiny dashboard cards; favor grouped tables and clear panels.

## 6. Shape system

| Token | Value | Use |
|---|---:|---|
| `radiusSm` | 10 | Badges and compact controls |
| `radiusMd` | 16 | Inputs and secondary cards |
| `radiusLg` | 22 | Main cards and grouped surfaces |
| `radiusXl` | 30 | Bounty cards and bottom sheets |
| `radiusPill` | 999 | Chips and circular action containers |

Rules:

- Main Bounty cards use 28–30 radius.
- Buttons use 16–18 radius, not excessive pills by default.
- Chips and status badges may be pills.
- Nesting should step radii down: sheet 30, card 22, inner control 14.

## 7. Elevation and borders

Shadows should feel like natural depth, not floating neon glow.

### Elevation levels

- `level0`: no shadow; background grouping only.
- `level1`: `0 4 16 rgba(36, 31, 24, 0.06)` for small surfaces.
- `level2`: `0 12 34 rgba(36, 31, 24, 0.11)` for Bounty cards.
- `level3`: `0 20 54 rgba(36, 31, 24, 0.16)` for modal sheets.

Android uses restrained elevation values paired with borders where needed.

Rules:

- Avoid shadow on every element.
- Use a 1px warm border to define low-elevation surfaces.
- Floating circular actions may use level2.
- Selected chips use a strong border, tinted fill, and check icon.

## 8. Iconography

- Use rounded, consistent stroke icons.
- Default icon size: 20–24.
- Navigation icon size: 22–24.
- Primary swipe actions: 25–28 inside 56–64 circular buttons.
- Pair unfamiliar icons with text.
- Use heart/check for Accept, `X` for Skip, upload arrow for Submission, sparkle/shield-check for AI passed, and clock/progress for processing.
- Do not mix filled and outlined icon families without semantic reason.

## 9. Motion system

Motion should be responsive and physical.

### Durations

| Token | Value | Use |
|---|---:|---|
| `instant` | 100ms | Press tint and icon response |
| `quick` | 180ms | Chip and tab transitions |
| `standard` | 280ms | Screen element entry |
| `emphasis` | 420ms | Card accept/skip and sheet presentation |

### Springs

- `snappy`: damping 20, stiffness 240 — chips and buttons.
- `card`: damping 18, stiffness 170 — Bounty drag return.
- `sheet`: damping 24, stiffness 210 — bottom sheets.

### Motion patterns

- Bounty card rotates subtly with horizontal drag, capped around 8 degrees.
- Accept/Skip decision label fades in proportionally to drag distance.
- Card exits in the gesture direction; next card scales from 0.96 to 1.
- Pressed controls scale to 0.97–0.98.
- Bottom sheets rise with a spring and dim the background softly.
- Submission progress transitions continuously; do not jump between arbitrary percentages.
- Respect reduced-motion preferences by replacing large transforms with opacity.

## 10. Core components

### Primary button

- Height: 56.
- Coral background and white label.
- 17px semibold label.
- 16px radius.
- Full width for onboarding and Submission actions.
- Loading state keeps width and label alignment stable.
- Disabled state uses neutral fill and muted text, not low-opacity Coral.

### Secondary button

- Surface background, Ink label, warm border.
- Same dimensions as primary when paired.
- Used for demo Creator and later actions.

### Text button

- No container unless over media.
- 15px semibold.
- Use for Skip-for-now and minor navigation only.

### Icon action

- 58–64 circular surface.
- Skip uses Ink icon and neutral surface.
- Accept uses Coral fill and white icon.
- Save is optional and not part of the first demo.
- Always accompany gesture controls below the Bounty stack.

### Chip

- Height: 40–44.
- Surface fill and border by default.
- Selected uses Ink background with white text for Niche selection.
- Status variants use semantic washes.
- Maintain at least 44px touch target.

### Bounty card

The most important component.

Structure:

1. Full-card visual artwork.
2. Top row: Bounty Type and Niche badges.
3. Bottom scrim.
4. Brand name eyebrow.
5. Product title.
6. Two-line brief or Deliverable preview.
7. Payout and deadline row.

Behavior:

- draggable horizontally;
- tap opens details sheet;
- right threshold accepts;
- left threshold skips locally;
- visible buttons duplicate both actions;
- ineligible Influencer Bounty remains viewable but cannot be accepted.

### Profile metric block

- Large value, compact label.
- ClapScore receives a restrained Eucalyptus badge.
- Follower count is labeled **Followers**, never Reach.
- Use three metrics maximum in one row.

### Deliverable row

- 20px status/number icon.
- One concise requirement.
- Optional supporting text.
- Passed/failed evidence appears only in Submission results, not the Bounty brief.

### Submission status card

- Semantic icon and wash.
- Canonical friendly label.
- Short explanation.
- Optional progress indicator.
- No client-generated backend state.

### Bottom navigation

- Three destinations for first mobile slice: Discover, Active, Profile.
- Warm solid surface with subtle top border.
- Active destination uses Ink and a small Coral indicator.
- Avoid a large floating center action because upload belongs to an Acceptance.

### Bottom sheet

- 30px top corners.
- Clear drag handle.
- Headline, concise context, and fixed bottom actions.
- No nested scroll unless content exceeds one viewport.

## 11. Screen patterns

### Welcome

- Warm Canvas background.
- Oversized wordmark and compact mark.
- One confident headline with generous whitespace.
- Abstract stacked-card artwork, not stock creator photography.
- Primary **Continue with Instagram**.
- Secondary **Use demo creator** visibly marked Demo.
- Privacy/metrics note in muted caption.

### Creator Profile confirmation

- Avatar, Instagram username, account type.
- Three metric blocks: Followers, ClapScore, Trust Score.
- Eucalyptus eligibility panel.
- Primary **Choose your niches**.

### Niche selection

- Clear title and one-sentence instruction.
- Flexible chip grid.
- All niches separated as a high-level option.
- Sticky bottom continue action.
- Immediate tactile selection feedback.

### Bounty discovery

- Minimal header: greeting/profile and compact filter context.
- One dominant card stack.
- Gesture action buttons beneath.
- Small counter or progress, not a crowded carousel indicator.
- Details appear in sheet without navigating away.

### Acceptance confirmation

- Compact celebratory motion, not confetti overload.
- Brand/Product summary.
- Deliverables checklist.
- **Upload now** primary; **View active task** secondary.

### Video selection

- Clear format/size guidance.
- Large dashed or tinted selection surface.
- Selected video preview takes visual priority.
- Replace and remove actions remain available.
- Upload action appears only after a valid selection.

### Submission processing

- Large state icon/animation.
- Step list: Upload received → Checking audio → Checking Deliverables → Reviewers.
- Current backend status highlighted; future steps remain neutral.
- Creator can leave safely and check Active later.

### Active

- Group by current state, not by arbitrary chronology.
- Product thumbnail, Brand, Bounty Type, Submission status.
- One clear continuation action per row.

## 12. Content style

### Voice

- Direct and encouraging.
- Avoid hype, slang overload, and vague AI language.
- Explain restrictions without blame.
- Prefer concrete verbs.

Examples:

- Good: **Pick the niches you actually create for.**
- Avoid: **Customize your algorithmic creator journey!**
- Good: **We couldn't hear the code “CLAP20.” Try another cut.**
- Avoid: **AI verification failed.**
- Good: **Your video is with reviewers.**
- Avoid: **Content processing completed successfully.**

### Button labels

Use verb-first labels:

- Continue with Instagram
- Use demo creator
- Choose your niches
- See Bounties
- Accept Bounty
- Upload now
- Choose a video
- Submit video
- Try another video

## 13. Accessibility

- Minimum touch target: 44 × 44.
- Primary controls target 52–56 high.
- Body text minimum: 15.
- Support dynamic text where it does not destroy key card composition.
- Provide accessibility labels for icon actions and Bounty gesture alternatives.
- Never require color recognition to understand state.
- Ensure video controls are reachable and labeled.
- Announce upload progress and Submission state changes.
- Respect reduced motion.
- Keep focus order consistent in bottom sheets and modals.

## 14. Haptics

Use sparingly:

- light selection haptic for Niche chip selection;
- medium impact when a Bounty crosses Accept/Skip threshold;
- success haptic when Acceptance is confirmed;
- warning haptic for destructive remove/reset actions;
- no repeated haptics during upload progress or processing polling.

## 15. Loading, empty, and failure states

### Loading

- Use skeleton geometry matching the final content.
- Do not use full-screen spinners for normal data fetches.
- Keep existing content visible during background refresh.

### Empty

- Explain why the state is empty and provide one relevant action.
- Empty Discover can offer **Reset skipped Bounties** in demo mode.
- Empty Active explains that accepted Bounties will appear there.

### Failure

- Show user-safe API message.
- Provide Retry only when retry is valid.
- Never expose provider payloads or raw stack traces.
- Submission `AI_FAILED` is a product outcome, not a red error screen.
- Submission `PROCESSING_ERROR` is an operational issue and should be visually distinct.

## 16. Implementation tokens

The code should expose a typed theme with these groups:

```ts
export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  motion,
  layout,
} as const;
```

Components consume semantic tokens (`colors.canvas`, `colors.coral`) instead of raw values. One-off artwork colors may live with fixture visual metadata, but UI chrome must use the shared theme.

## 17. Design review checklist

A screen is ready when:

- its primary action is immediately obvious;
- no more than one saturated accent dominates;
- text hierarchy is readable at a glance;
- content aligns to the spacing grid;
- every gesture has a visible alternative;
- loading, empty, failure, and disabled states exist;
- canonical backend terminology is preserved in models;
- amounts and eligibility are not locally calculated;
- motion reinforces rather than delays the task;
- Android safe areas and back behavior are correct;
- the screen looks intentional without relying on neon color, glassmorphism, or excessive gradients.
