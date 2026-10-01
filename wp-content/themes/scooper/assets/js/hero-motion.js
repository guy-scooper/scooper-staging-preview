/* Hero-only depth. CSS owns autonomous motion; rAF batches event-driven writes. */
( function () {
	'use strict';
	var hero = document.querySelector( '.scooper-hero-motion' );
	if ( ! hero ) { return; }
	var region = hero.closest( '.scooper-hero-grid' );
	var reduced = window.matchMedia( '(prefers-reduced-motion: reduce)' );
	var desktop = window.matchMedia( '(hover: hover) and (pointer: fine) and (min-width: 782px)' );
	var visible = true;
	var frame = 0;
	var x = 0;
	var y = 0;
	var bounds;
	function paint() {
		frame = 0;
		var active = ! reduced.matches && desktop.matches;
		var rect = hero.getBoundingClientRect();
		var depth = active ? Math.max( -1, Math.min( 1, ( window.innerHeight * .48 - rect.top - rect.height / 2 ) / window.innerHeight ) ) * 22 : 0;
		hero.style.setProperty( '--hero-x', ( active ? x * 8 : 0 ) + 'px' );
		hero.style.setProperty( '--hero-y', ( active ? y * 6 : 0 ) + 'px' );
		hero.style.setProperty( '--hero-rx', ( active ? y * -2 : 0 ) + 'deg' );
		hero.style.setProperty( '--hero-ry', ( active ? x * 3 : 0 ) + 'deg' );
		hero.style.setProperty( '--hero-scroll', depth + 'px' );
	}
	function schedule() {
		if ( ! frame && visible ) { frame = window.requestAnimationFrame( paint ); }
	}
	region.addEventListener( 'pointerenter', function () { bounds = region.getBoundingClientRect(); } );
	region.addEventListener( 'pointermove', function ( event ) {
		if ( reduced.matches || ! desktop.matches || event.pointerType === 'touch' ) { return; }
		if ( ! bounds ) { bounds = region.getBoundingClientRect(); }
		x = Math.max( -1, Math.min( 1, ( event.clientX - bounds.left ) / bounds.width * 2 - 1 ) );
		y = Math.max( -1, Math.min( 1, ( event.clientY - bounds.top ) / bounds.height * 2 - 1 ) );
		schedule();
	}, { passive:true } );
	region.addEventListener( 'pointerleave', function () { x = 0; y = 0; schedule(); } );
	function refresh() { bounds = null; schedule(); }
	window.addEventListener( 'scroll', refresh, { passive:true } );
	window.addEventListener( 'resize', refresh, { passive:true } );
	reduced.addEventListener( 'change', schedule );
	desktop.addEventListener( 'change', schedule );
	function pause() {
		hero.toggleAttribute( 'data-motion-paused', ! visible || document.hidden );
	}
	document.addEventListener( 'visibilitychange', pause );
	if ( 'IntersectionObserver' in window ) {
		new IntersectionObserver( function ( entries ) {
			visible = entries[ 0 ].isIntersecting;
			pause();
			schedule();
		} ).observe( hero );
	}
	pause();
	schedule();
}() );
