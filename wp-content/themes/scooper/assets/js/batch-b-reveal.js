( function () {
	'use strict';
	const reduced = window.matchMedia( '(prefers-reduced-motion: reduce)' );
	const personas = document.querySelector( '.scooper-personas' );
	const lowerEnvironment = document.querySelector( '.scooper-lower-environment' );
	const verticals = document.querySelector( '.scooper-verticals' );
	const capabilities = document.querySelector( '.scooper-capabilities' );
	const faq = document.querySelector( '.scooper-faq' );
	if ( personas && lowerEnvironment && verticals && capabilities && faq && lowerEnvironment.contains( verticals ) ) {
		let frame = 0;
		const boundaryPalette = [ [ 255, 252, 255 ], [ 244, 239, 245 ], [ 198, 185, 201 ], [ 111, 93, 116 ], [ 45, 22, 49 ] ];
		const boundaryAccentPalette = [ [ 181, 20, 105 ], [ 190, 37, 120 ], [ 207, 90, 154 ], [ 241, 162, 213 ], [ 241, 162, 213 ] ];
		const lowerPalette = [ [ 45, 22, 49 ], [ 68, 50, 73 ], [ 108, 88, 115 ], [ 174, 158, 184 ], [ 226, 216, 232 ], [ 250, 247, 251 ] ];
		const smooth = ( value ) => value * value * ( 3 - 2 * value );
		const colorAt = ( palette, progress ) => {
			const scaled = Math.max( 0, Math.min( 1, progress ) ) * ( palette.length - 1 );
			const step = Math.min( palette.length - 2, Math.floor( scaled ) );
			const blend = smooth( scaled - step );
			const channels = palette[ step ].map( ( channel, index ) => channel + ( palette[ step + 1 ][ index ] - channel ) * blend );
			return 'rgb(' + channels.map( ( channel ) => channel.toFixed( 2 ) ).join( ',' ) + ')';
		};
		const updateEnvironment = () => {
			frame = 0;
			const boundaryProgress = Math.max( 0, Math.min( 1, ( window.innerHeight * .88 - verticals.getBoundingClientRect().top ) / ( window.innerHeight * .46 ) ) );
			const boundaryColor = colorAt( boundaryPalette, boundaryProgress );
			const inkProgress = smooth( Math.max( 0, Math.min( 1, ( boundaryProgress - .66 ) / .06 ) ) );
			const boundaryInk = colorAt( [ [ 32, 25, 35 ], [ 255, 255, 255 ] ], inkProgress );
			const boundaryAccent = colorAt( boundaryAccentPalette, boundaryProgress );
			personas.style.setProperty( '--boundary-color', boundaryColor );
			personas.style.setProperty( '--boundary-ink', boundaryInk );
			personas.style.setProperty( '--boundary-accent', boundaryAccent );

			const start = capabilities.getBoundingClientRect().top + window.scrollY - window.innerHeight * .55;
			const end = faq.getBoundingClientRect().top + window.scrollY - window.innerHeight * .72;
			const lowerProgress = Math.max( 0, Math.min( 1, ( window.scrollY - start ) / Math.max( 1, end - start ) ) );
			const lowerColor = lowerProgress > 0 ? colorAt( lowerPalette, lowerProgress ) : boundaryColor;
			const lowerInk = lowerProgress < .56 ? '#FFFDFE' : '#2D1631';
			const lowerAccent = lowerProgress < .56 ? '#F1A2D5' : '#B51469';
			lowerEnvironment.style.setProperty( '--boundary-color', boundaryColor );
			lowerEnvironment.style.setProperty( '--boundary-ink', boundaryInk );
			lowerEnvironment.style.setProperty( '--boundary-accent', boundaryAccent );
			lowerEnvironment.style.setProperty( '--lower-environment-color', lowerColor );
			lowerEnvironment.style.setProperty( '--lower-environment-ink', lowerInk );
			lowerEnvironment.style.setProperty( '--lower-environment-accent', lowerAccent );
		};
		const scheduleEnvironment = () => {
			if ( ! frame ) { frame = window.requestAnimationFrame( updateEnvironment ); }
		};
		window.addEventListener( 'scroll', scheduleEnvironment, { passive: true } );
		window.addEventListener( 'resize', scheduleEnvironment );
		if ( 'ResizeObserver' in window ) {
			const sizeObserver = new ResizeObserver( scheduleEnvironment );
			sizeObserver.observe( personas );
			sizeObserver.observe( lowerEnvironment );
		}
		updateEnvironment();
	}
	if ( reduced.matches || ! ( 'IntersectionObserver' in window ) ) { return; }
	const observer = new IntersectionObserver( ( entries ) => {
		entries.forEach( ( entry ) => {
			if ( entry.isIntersecting ) {
				entry.target.addEventListener( 'transitionend', ( event ) => {
					if ( event.target === entry.target && event.propertyName === 'opacity' ) {
						entry.target.classList.remove( 'scooper-b-reveal', 'is-card' );
						entry.target.style.removeProperty( '--b-delay' );
					}
				} );
				entry.target.classList.remove( 'is-pending' );
				observer.unobserve( entry.target );
			}
		} );
	}, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 } );
	document.querySelectorAll( '.scooper-personas,.scooper-verticals,.scooper-capabilities,.scooper-testimonials' ).forEach( ( section ) => {
		let cardIndex = 0;
		section.querySelectorAll( '.scooper-section-heading,.scooper-section-copy,.scooper-verticals__heading,.scooper-persona-card,.scooper-capability-card,.scooper-testimonial' ).forEach( ( element ) => {
			const isCard = element.matches( '.scooper-persona-card,.scooper-capability-card,.scooper-testimonial' );
			const columns = isCard ? getComputedStyle( element.parentElement ).gridTemplateColumns.split( ' ' ).length : 1;
			const delay = isCard ? cardIndex++ % columns * 95 : 0;
			// Deep anchor arrivals stay visible; only content below the viewport is armed.
			if ( element.getBoundingClientRect().top < window.innerHeight * 0.93 ) { return; }
			element.classList.add( 'scooper-b-reveal', 'is-pending' );
			if ( isCard ) { element.classList.add( 'is-card' ); }
			element.style.setProperty( '--b-delay', delay + 'ms' );
			observer.observe( element );
		} );
	} );
	reduced.addEventListener( 'change', ( event ) => {
		if ( event.matches ) {
			observer.disconnect();
			document.querySelectorAll( '.scooper-b-reveal' ).forEach( ( element ) => element.classList.remove( 'is-pending' ) );
		}
	} );
}() );
