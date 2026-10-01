( function () {
	'use strict';

	if ( ! ( 'IntersectionObserver' in window ) || window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ) {
		return;
	}

	var prepared = [];
	var observers = [];
	var laterTriggerRatio = 0.725;
	var clientTriggerRatio = 0.78;

	function prepare( element, modifier, delay ) {
		if ( ! element ) {
			return;
		}

		element.classList.add( 'scooper-reveal', modifier, 'scooper-reveal--pending' );
		element.style.setProperty( '--scooper-reveal-delay', delay + 'ms' );
		prepared.push( element );
	}

	function reveal( targets ) {
		window.requestAnimationFrame( function () {
			targets.forEach( function ( target ) {
				if ( target.classList.contains( 'is-revealed' ) ) {
					return;
				}

				var settled = false;
				var delay = parseFloat( target.style.getPropertyValue( '--scooper-reveal-delay' ) ) || 0;
				var duration = parseFloat( window.getComputedStyle( target ).transitionDuration ) * 1000 || 650;

				function settle() {
					if ( settled ) {
						return;
					}

					settled = true;
					target.classList.remove( 'scooper-reveal--pending', 'scooper-reveal--armed' );
					target.style.removeProperty( '--scooper-reveal-delay' );
					target.removeEventListener( 'transitionend', onTransitionEnd );
				}

				function onTransitionEnd( event ) {
					if ( event.target === target && event.propertyName === 'opacity' ) {
						settle();
					}
				}

				target.addEventListener( 'transitionend', onTransitionEnd );
				target.classList.add( 'is-revealed' );
				window.setTimeout( settle, delay + duration + 120 );
			} );
		} );
	}

	function failOpen() {
		observers.forEach( function ( observer ) {
			observer.disconnect();
		} );
		prepared.forEach( function ( target ) {
			target.classList.remove( 'scooper-reveal--pending', 'scooper-reveal--armed' );
			target.style.removeProperty( '--scooper-reveal-delay' );
		} );
	}

	function observeAtViewportLine( root, targets, triggerRatio ) {
		if ( ! root || ! targets.length ) {
			return;
		}

		var observer = new IntersectionObserver( function ( entries ) {
			entries.forEach( function ( entry ) {
				var triggerBottom = entry.rootBounds ? entry.rootBounds.bottom : window.innerHeight * triggerRatio;
				if ( ! entry.isIntersecting && entry.boundingClientRect.top > triggerBottom ) {
					return;
				}

				reveal( targets );
				observer.unobserve( root );
			} );
		}, {
			rootMargin: '0px 0px -' + ( ( 1 - triggerRatio ) * 100 ).toFixed( 1 ) + '% 0px',
			threshold: 0
		} );

		observers.push( observer );
		observer.observe( root );
	}

	function rtlReadingOrder( items ) {
		return items.slice().sort( function ( first, second ) {
			var firstRect = first.getBoundingClientRect();
			var secondRect = second.getBoundingClientRect();

			if ( Math.abs( firstRect.top - secondRect.top ) > 8 ) {
				return firstRect.top - secondRect.top;
			}

			return secondRect.right - firstRect.right;
		} );
	}

	function mobileRowDelay( item, orderedItems ) {
		var itemTop = item.getBoundingClientRect().top;
		var rowItems = orderedItems.filter( function ( candidate ) {
			return Math.abs( candidate.getBoundingClientRect().top - itemTop ) <= 8;
		} );

		return Math.max( 0, rowItems.indexOf( item ) ) * 150;
	}

	try {
		var hero = document.querySelector( '.scooper-hero-grid' );
		var heroTargets = [];
		var heroCopy = [
			[ document.querySelector( '.scooper-hero h1' ), 'scooper-reveal--heading-horizontal', 0 ],
			[ document.querySelector( '.scooper-hero-copy > p' ), 'scooper-reveal--subheading-horizontal', 220 ],
			[ document.querySelector( '.scooper-hero-copy .wp-block-buttons' ), 'scooper-reveal--cta', 360 ],
			[ document.querySelector( '.scooper-hero-visual' ), 'scooper-reveal--hero-visual', 120 ]
		];

		heroCopy.forEach( function ( item ) {
			prepare( item[ 0 ], item[ 1 ], item[ 2 ] );
			if ( item[ 0 ] ) {
				heroTargets.push( item[ 0 ] );
			}
		} );

		document.querySelectorAll( '.scooper-hero-visual .scooper-signal' ).forEach( function ( signal, index ) {
			prepare( signal, 'scooper-reveal--signal', 300 + ( index * 100 ) );
			heroTargets.push( signal );
		} );

		var valueStrip = document.querySelector( '.scooper-value-strip' );
		var valueItems = rtlReadingOrder( Array.from( document.querySelectorAll( '.scooper-value-strip .scooper-value-item' ) ) );
		var mobileValues = window.matchMedia( '(max-width: 800px)' ).matches;
		var valueTargets = [];

		var closing = document.querySelector( '.scooper-values-closing' );
		prepare( closing, 'scooper-reveal--closing', mobileValues ? 0 : valueItems.length * 150 );
		if ( closing ) {
			valueTargets.push( closing );
		}

		var clientHeading = document.querySelector( '.scooper-logo-section h2' );
		prepare( clientHeading, 'scooper-reveal--heading-vertical', 0 );

		window.requestAnimationFrame( function () {
			window.requestAnimationFrame( function () {
				try {
					prepared.forEach( function ( target ) {
						target.classList.add( 'scooper-reveal--armed' );
					} );

					reveal( heroTargets );
					if ( mobileValues ) {
						observeAtViewportLine( closing, closing ? [ closing ] : [], laterTriggerRatio );
					} else {
						observeAtViewportLine( valueStrip, valueTargets, laterTriggerRatio );
					}
					observeAtViewportLine( clientHeading, clientHeading ? [ clientHeading ] : [], clientTriggerRatio );
				} catch ( error ) {
					failOpen();
				}
			} );
		} );
	} catch ( error ) {
		failOpen();
	}
}() );
