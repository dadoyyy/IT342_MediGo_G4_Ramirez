function buildContext(search) {
  const params = new URLSearchParams(search);
  return {
    token: params.get('token'),
    pending: params.get('pending'),
    error: params.get('error'),
  };
}

const strategies = [
  {
    supports: (ctx) => Boolean(ctx.token),
    resolve: (ctx) => ({
      type: 'TOKEN_SUCCESS',
      token: ctx.token,
      path: '/dashboard',
      state: { justLoggedIn: true },
    }),
  },
  {
    supports: (ctx) => Boolean(ctx.pending),
    resolve: (ctx) => ({
      type: 'PENDING_ROLE',
      path: `/auth/select-role?pending=${encodeURIComponent(ctx.pending)}`,
    }),
  },
  {
    supports: () => true,
    resolve: (ctx) => ({
      type: 'ERROR',
      error: ctx.error ? decodeURIComponent(ctx.error) : 'Google sign-in failed. Please try again.',
    }),
  },
];

export function resolveAuthCallbackAction(search) {
  const context = buildContext(search);
  const strategy = strategies.find((candidate) => candidate.supports(context));
  return strategy.resolve(context);
}
