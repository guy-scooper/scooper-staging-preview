( function () {
	'use strict';
	const reduced = window.matchMedia( '(prefers-reduced-motion: reduce)' );
	const compact = window.matchMedia( '(max-width: 800px)' );
	document.querySelectorAll( '.scooper-value-strip' ).forEach( function ( strip ) {
		const svg = strip.querySelector( '.scooper-value-signal' );
		if ( ! svg ) { return; }
		const geometry = svg.querySelector( '.scooper-value-signal__geometry' );
		const path = svg.querySelector( 'path' );
		const draw = svg.querySelector( '.scooper-value-signal__draw' );
		const halo = svg.querySelector( '.scooper-value-signal__halo' );
		const head = svg.querySelector( '.scooper-value-signal__head' );
		const items = Array.from( strip.querySelectorAll( '.scooper-value-item' ) );
		const length = path.getTotalLength();
		let state = 'ready', frame = 0, start = 0, reactions = [], animations = [];

		function orient() {
			svg.setAttribute( 'viewBox', compact.matches ? '0 0 240 1200' : '0 0 1200 240' );
			geometry.setAttribute( 'transform', compact.matches ? 'translate(0 1200) rotate(-90)' : '' );
		}
		function clear() {
			cancelAnimationFrame( frame );
			animations.forEach( animation => animation.cancel() );
			animations = [];
			[ draw, halo, head ].forEach( element => { element.style.opacity = '0'; } );
		}
		function accent( item ) {
			const timing = { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' };
			animations.push( item.animate( [ { translate: '0 0' }, { translate: '0 ' + ( compact.matches ? '-3px' : '-5px' ), offset: .4 }, { translate: '0 0' } ], timing ) );
			const icon = item.querySelector( '.scooper-line-icon' );
			if ( icon ) {
				animations.push( icon.animate( [ { filter: 'drop-shadow(0 0 0 transparent)' }, { filter: 'drop-shadow(0 0 ' + ( compact.matches ? '2px' : '3px' ) + ' #ec238640)', offset: .4 }, { filter: 'drop-shadow(0 0 0 transparent)' } ], timing ) );
			}
		}
		function play() {
			if ( state !== 'ready' || reduced.matches ) { return; }
			state = 'playing';
			// Match the leading sweep to actual item positions, in Hebrew reading order.
			const matrix = geometry.getScreenCTM();
			let previous = 0;
			reactions = items.map( function ( item ) {
				const rect = item.getBoundingClientRect();
				const target = compact.matches ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
				let best = previous, distance = Infinity;
				for ( let progress = previous; progress <= .5; progress += .001 ) {
					const point = path.getPointAtLength( progress * length );
					const screen = new DOMPoint( point.x, point.y ).matrixTransform( matrix );
					const delta = Math.abs( ( compact.matches ? screen.y : screen.x ) - target );
					if ( delta < distance ) { distance = delta; best = progress; }
				}
				previous = Math.min( .5, best + .045 );
				return { item: item, progress: best, played: false };
			} );
			start = performance.now() + 250;
			[ draw, halo ].forEach( element => { element.style.strokeDasharray = length; element.style.strokeDashoffset = length; } );
			frame = requestAnimationFrame( tick );
		}
		function tick( now ) {
			const elapsed = now - start;
			if ( elapsed < 0 ) { frame = requestAnimationFrame( tick ); return; }
			const time = Math.min( 1, elapsed / 1700 );
			// Continuous sweep; gentle acceleration/deceleration with no mid-path pause.
			const progress = time - Math.sin( 2 * Math.PI * time ) / ( 8 * Math.PI );
			const fade = Math.min( 1, elapsed / 100, ( 1700 - elapsed ) / 220 );
			draw.style.strokeDashoffset = halo.style.strokeDashoffset = length * ( 1 - progress );
			draw.style.opacity = Math.max( 0, fade ) * .22;
			halo.style.opacity = Math.max( 0, fade ) * ( compact.matches ? .09 : .14 );
			const point = path.getPointAtLength( progress * length );
			head.setAttribute( 'transform', 'translate(' + point.x + ' ' + point.y + ')' );
			head.style.opacity = Math.max( 0, fade ) * .85;
			reactions.forEach( reaction => {
				if ( ! reaction.played && progress >= reaction.progress ) { reaction.played = true; accent( reaction.item ); }
			} );
			if ( time < 1 ) { frame = requestAnimationFrame( tick ); }
			else { clear(); state = 'played'; }
		}
		orient();
		compact.addEventListener( 'change', function () { clear(); orient(); state = 'played'; } );
		reduced.addEventListener( 'change', function () { clear(); state = 'played'; } );
		if ( ! ( 'IntersectionObserver' in window ) || ! items[ 0 ] || ! items[ 0 ].animate ) { return; }
		new IntersectionObserver( function ( entries ) {
			entries.forEach( function ( entry ) {
				const rect = entry.boundingClientRect;
				if ( ! entry.isIntersecting && ( rect.bottom <= -32 || rect.top >= innerHeight + 32 ) ) {
					clear(); state = 'ready';
				} else {
					const visible = Math.max( 0, Math.min( rect.bottom, innerHeight ) - Math.max( rect.top, 0 ) );
					if ( visible >= Math.min( rect.height * .58, innerHeight * .9 ) ) { play(); }
				}
			} );
		}, { rootMargin: '32px 0px', threshold: Array.from( { length: 101 }, ( _, i ) => i / 100 ) } ).observe( strip );
	} );
}() );
