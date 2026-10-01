// One Vehicles controller per selector. No timers, global framework or retained inactive observers.
const journeys = new WeakMap();
const easing = 'cubic-bezier(.22,.61,.36,1)';

function stop( entry ) {
	entry.observer.disconnect();
	entry.media.removeEventListener( 'change', entry.onMotionChange );
	window.cancelAnimationFrame( entry.frame );
	entry.animations.forEach( animation => animation.cancel() );
	entry.animations = [];
	entry.started = false;
	entry.visual.removeAttribute( 'data-auto-state' );
}

function play( entry ) {
	if ( ! entry.active || entry.media.matches || ! entry.panel.classList.contains( 'is-active' ) ) { return; }
	const bounds = entry.visual.getBoundingClientRect();
	const visible = Math.max( 0, Math.min( bounds.bottom, window.innerHeight ) - Math.max( bounds.top, 0 ) );
	const inView = bounds.width > 0 && visible >= Math.min( bounds.height * .58, window.innerHeight * .9 );
	if ( entry.started ) {
		entry.animations.forEach( animation => {
			if ( ! inView && animation.playState === 'running' ) { animation.pause(); }
			if ( inView && animation.playState === 'paused' ) { animation.play(); }
		} );
		return;
	}
	if ( ! inView ) { return; }
	entry.started = true;
	entry.visual.dataset.autoState = 'playing';
	const cue = name => entry.visual.querySelector( `[data-auto-cue="${ name }"]` );
	function animate( target, frames, delay, duration = 650 ) {
		if ( ! target ) { return; }
		const animation = target.animate( frames, { delay, duration, easing, fill: 'both' } );
		entry.animations.push( animation );
		return animation;
	}
	for ( let i = 0; i < 5; i++ ) {
		const source = cue( `source-${ i }` );
		const feed = cue( `feed-${ i }` );
		const start = 280 + i * 220;
		animate( source, { opacity: [ .5, 1 ], filter: [ 'saturate(.65) brightness(.72)', 'saturate(1) brightness(1.08)', 'none' ] }, start, 720 );
		animate( source.querySelector( '.scooper-automotive__source-signal' ), { opacity: [ .14, 1 ], transform: [ 'scale(.6)', 'scale(1.35)', 'scale(1)' ] }, start + 120, 520 );
		feed.querySelectorAll( 'path' ).forEach( path => animate( path, { strokeDashoffset: [ '1', '0' ], opacity: [ .06, path.classList.contains( 'scooper-automotive__feed-glow' ) ? .68 : 1 ] }, start + 220, 1050 ) );
	}
	animate( cue( 'spine-glow' ), { strokeDashoffset: [ '1', '0' ], opacity: [ .06, .48 ] }, 1380, 4550 );
	animate( cue( 'spine-core' ), { strokeDashoffset: [ '1', '0' ], opacity: [ .06, .96 ] }, 1420, 4500 );
	const stageStarts = [ 1650, 2250, 2860, 3480, 5260 ];
	stageStarts.forEach( ( start, i ) => {
		const layer = cue( `layer-${ i }` );
		const duration = i === 3 ? 1500 : 900;
		animate( layer, { filter: [ 'brightness(.64) saturate(.66) drop-shadow(0 7px 8px #02061288)', i === 3 ? 'brightness(1.28) saturate(1.22) drop-shadow(0 0 12px #ee54ddaa)' : 'brightness(1.18) saturate(1.05) drop-shadow(0 0 9px #7faaff88)', 'none' ] }, start, duration );
		animate( layer.querySelector( '.scooper-automotive__aura' ), { opacity: [ 0, i === 3 ? .94 : .48, i === 3 ? .72 : .25 ] }, start + 40, duration );
		animate( layer.querySelector( '.scooper-automotive__stage-content' ), { opacity: [ .56, 1 ] }, start + 80, duration * .72 );
		animate( layer.querySelector( '.scooper-automotive__sheen' ), { opacity: [ .22, .86, .45 ] }, start, duration );
	} );
	const network = cue( 'network' );
	animate( network.querySelector( '.scooper-automotive__connections' ), { strokeDashoffset: [ '1', '0' ], opacity: [ .06, 1 ] }, 3760, 1400 );
	for ( let i = 0; i < 5; i++ ) {
		animate( cue( `node-${ i }` ), { opacity: [ .12, 1 ], filter: [ 'brightness(.7)', 'brightness(1.45)', 'brightness(1)' ] }, 3820 + i * 135, 720 );
	}
	animate( entry.visual.querySelector( '.scooper-automotive__brand' ), { opacity: [ .32, 1 ], filter: [ 'drop-shadow(0 0 0 #f041da)', 'drop-shadow(0 0 13px #f041da)', 'drop-shadow(0 0 8px #f041da)' ] }, 4020, 1320 );
	const outflow = cue( 'outflow' );
	outflow.querySelectorAll( 'path' ).forEach( path => animate( path, { strokeDashoffset: [ '1', '0' ], opacity: [ .06, path.classList.contains( 'scooper-automotive__outflow-glow' ) ? .68 : 1 ] }, 5550, 1050 ) );
	const outcome = cue( 'outcome' );
	const last = animate( outcome, { opacity: [ .2, 1 ], filter: [ 'saturate(.65) brightness(.72)', 'saturate(1.05) brightness(1.1)', 'none' ], transform: [ 'translateY(6px)', 'translateY(0)' ] }, 6150, 1050 );
	animate( outcome.querySelector( '.scooper-automotive__platform-glow' ), { opacity: [ .18, 1, .9 ], transform: [ 'scale(.78)', 'scale(1.04)', 'scale(1)' ] }, 6020, 1200 );
	last.finished.then( () => {
		if ( entry.active && entry.animations.includes( last ) ) { entry.visual.dataset.autoState = 'complete'; }
	} ).catch( () => {} ); // Cancellation on tab exit is expected.
}

export function queueAutomotiveJourney( root, activeId ) {
	const entry = root && journeys.get( root );
	if ( ! entry ) { return; }
	stop( entry );
	entry.active = activeId === 'automotive';
	if ( ! entry.active ) { return; }
	entry.media.addEventListener( 'change', entry.onMotionChange );
	if ( entry.media.matches ) { return; }
	entry.visual.dataset.autoState = 'waiting';
	entry.observer.observe( entry.visual );
	entry.frame = window.requestAnimationFrame( () => play( entry ) );
}

export function initAutomotiveJourney( root, activeId ) {
	const visual = root && root.querySelector( '[data-automotive-journey]' );
	if ( ! visual || journeys.has( root ) || ! ( 'IntersectionObserver' in window ) || ! visual.animate ) { return; }
	const entry = { visual, panel: visual.closest( '.scooper-verticals__panel' ), media: window.matchMedia( '(prefers-reduced-motion: reduce)' ), animations: [], active: false, started: false, frame: 0 };
	entry.observer = new IntersectionObserver( () => play( entry ), { threshold: Array.from( { length: 101 }, ( _, i ) => i / 100 ) } );
	entry.onMotionChange = () => queueAutomotiveJourney( root, entry.active ? 'automotive' : '' );
	journeys.set( root, entry );
	queueAutomotiveJourney( root, activeId );
}
