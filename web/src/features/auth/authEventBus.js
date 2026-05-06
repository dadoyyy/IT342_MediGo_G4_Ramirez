const AUTH_EVENT_LOGIN = 'auth:login';
const AUTH_EVENT_LOGOUT = 'auth:logout';
const AUTH_EVENT_SESSION_EXPIRED = 'auth:session-expired';

const eventTarget = new EventTarget();

function emit(eventName, detail = {}) {
  eventTarget.dispatchEvent(new CustomEvent(eventName, { detail }));
}

function subscribe(eventName, handler) {
  const wrappedHandler = (event) => handler(event.detail);
  eventTarget.addEventListener(eventName, wrappedHandler);
  return () => eventTarget.removeEventListener(eventName, wrappedHandler);
}

export const authEvents = {
  names: {
    login: AUTH_EVENT_LOGIN,
    logout: AUTH_EVENT_LOGOUT,
    sessionExpired: AUTH_EVENT_SESSION_EXPIRED,
  },
  emit,
  subscribe,
};
