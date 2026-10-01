document.addEventListener('submit', event => event.preventDefault(), true);
document.addEventListener('click', event => {
  const link = event.target.closest('a[data-preview-disabled]');
  if (link) event.preventDefault();
}, true);
