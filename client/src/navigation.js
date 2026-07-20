export function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function navigateFromLink(event, path) {
  event.preventDefault();
  navigate(path);
}
