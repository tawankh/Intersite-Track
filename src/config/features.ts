/**
 * Feature flags for incremental rollout of premium features.
 */
export const FEATURES = {
  // Phase 1
  THEME_TOGGLE: true,
  GLASSMORPHISM: true,
  CONFETTI: true,
  SKELETON_LOADING: true,

  // Phase 2
  KANBAN_VIEW: true,

  // Phase 3
  COMMENTS: false, // Requires DB migration
  ACTIVITY_LOG: false, // Requires DB migration

  // Phase 4
  DASHBOARD_REORDER: true,
  PDF_EXPORT: true,
};

/** Aliased shape used by components */
export const features = {
  premiumTheme: { enabled: FEATURES.THEME_TOGGLE },
  kanbanBoard: { enabled: FEATURES.KANBAN_VIEW },
  premiumConfetti: { enabled: FEATURES.CONFETTI },
};
