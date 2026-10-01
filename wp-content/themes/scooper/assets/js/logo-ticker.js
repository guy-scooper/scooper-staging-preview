( function () {
	'use strict';

	document.querySelectorAll( '.scooper-logo-ticker' ).forEach( function ( ticker ) {
		var track = ticker.querySelector( '.scooper-logo-track' );
		if ( ! track || ! track.children.length ) {
			return;
		}

		var rail = document.createElement( 'div' );
		rail.className = 'scooper-logo-rail';
		track.before( rail );
		rail.append( track );

		var clone = track.cloneNode( true );
		clone.classList.add( 'scooper-logo-clone' );
		clone.setAttribute( 'aria-hidden', 'true' );
		clone.inert = true;
		clone.removeAttribute( 'id' );
		clone.querySelectorAll( '[id]' ).forEach( function ( element ) {
			element.removeAttribute( 'id' );
		} );
		rail.append( clone );

		var reducedMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' );
		var coarsePointer = window.matchMedia( '(hover: none), (pointer: coarse)' );
		var pausedByFocus = false;

		function setPaused( paused ) {
			ticker.classList.toggle( 'is-paused', paused );
			ticker.setAttribute( 'aria-pressed', String( paused ) );
			ticker.setAttribute( 'aria-label', paused ? 'הפעלת תנועת הלוגואים' : 'עצירת תנועת הלוגואים' );
		}

		if ( ! reducedMotion.matches ) {
			ticker.tabIndex = 0;
			ticker.setAttribute( 'role', 'button' );
			setPaused( false );

			ticker.addEventListener( 'click', function () {
				if ( coarsePointer.matches ) {
					pausedByFocus = false;
					setPaused( ! ticker.classList.contains( 'is-paused' ) );
				}
			} );

			ticker.addEventListener( 'keydown', function ( event ) {
				if ( event.key !== 'Enter' && event.key !== ' ' ) {
					return;
				}

				event.preventDefault();
				pausedByFocus = false;
				setPaused( ! ticker.classList.contains( 'is-paused' ) );
			} );

			ticker.addEventListener( 'focus', function () {
				window.requestAnimationFrame( function () {
					if ( document.activeElement === ticker && ticker.matches( ':focus-visible' ) && ! ticker.classList.contains( 'is-paused' ) ) {
						pausedByFocus = true;
						setPaused( true );
					}
				} );
			} );

			ticker.addEventListener( 'blur', function () {
				if ( pausedByFocus ) {
					pausedByFocus = false;
					setPaused( false );
				}
			} );
		}

		function syncVisibility() {
			ticker.classList.toggle( 'is-page-hidden', document.hidden );
		}

		function measure() {
			var distance = track.getBoundingClientRect().width;
			ticker.style.setProperty( '--scooper-ticker-width', ticker.clientWidth + 'px' );
			rail.style.animationDuration = ( distance / 25 ) + 's';
		}

		document.addEventListener( 'visibilitychange', syncVisibility );
		new ResizeObserver( measure ).observe( ticker );
		syncVisibility();
		measure();
	} );
}() );
