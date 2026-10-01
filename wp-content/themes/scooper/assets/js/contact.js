/* Front-end staging preview only. Never read, store or transmit field values. */
(() => {
	'use strict';
	document.querySelectorAll('.scooper-contact__form').forEach((form) => {
		const button = form.querySelector('.scooper-contact__submit');
		const notice = form.querySelector('.scooper-contact__status span');
		if (!button || !notice) return;
		form.addEventListener('submit', (event) => {
			event.preventDefault();
			notice.hidden = false;
		});
		button.disabled = false;
	});
})();
