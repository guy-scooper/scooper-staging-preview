// Lifecycle shared only by the three approved Batch A scenes.
const scenes = new WeakMap();
const ease = 'cubic-bezier(.22,.61,.36,1)';
const labels = { technology: 'technology', communications: 'communications', nonprofits: 'nonprofits' };

function cancelAnimations( entry ) {
	window.cancelAnimationFrame( entry.frame );
	entry.frame = 0;
	entry.animations.forEach( animation => animation.cancel() );
	entry.animations = [];
	entry.started = false;
}

function setComplete( entry, stopped = false ) {
	cancelAnimations( entry );
	entry.finished = true;
	entry.started = true;
	entry.visual.dataset.sceneState = 'complete';
	entry.visual.toggleAttribute( 'data-scene-stopped', stopped );
	entry.stop.disabled = true;
	entry.stop.textContent = stopped ? 'האנימציה נעצרה' : 'האנימציה הושלמה';
	entry.visual.querySelectorAll( '[data-message-hit]' ).forEach( node => node.classList.toggle( 'is-message-hit', entry.kind === 'communications' ) );
}

function animate( entry, target, frames, delay, duration = 650 ) {
	if ( ! target ) { return null; }
	const animation = target.animate( frames, { delay, duration, easing: ease, fill: 'both' } );
	entry.animations.push( animation );
	return animation;
}

function visibleEnough( entry ) {
	const bounds = entry.visual.getBoundingClientRect();
	const visible = Math.max( 0, Math.min( bounds.bottom, window.innerHeight ) - Math.max( bounds.top, 0 ) );
	return bounds.width > 0 && visible >= Math.min( bounds.height * .48, window.innerHeight * .72 );
}

function updatePlayback( entry ) {
	if ( entry.finished || ! entry.active || entry.media.matches || ! entry.panel.classList.contains( 'is-active' ) ) { return; }
	const canPlay = visibleEnough( entry ) && ! document.hidden;
	if ( ! entry.started ) {
		if ( canPlay ) { playScene( entry ); }
		return;
	}
	entry.animations.forEach( animation => {
		if ( canPlay && animation.playState === 'paused' ) { animation.play(); }
		if ( ! canPlay && animation.playState === 'running' ) { animation.pause(); }
	} );
}

function playScene( entry ) {
	if ( entry.started || ! entry.active || entry.media.matches ) { return; }
	entry.started = true;
	entry.visual.dataset.sceneState = 'playing';
	entry.visual.removeAttribute( 'data-scene-stopped' );
	entry.stop.disabled = false;
	entry.stop.textContent = 'עצירת אנימציה';

	const a = Array.from( entry.visual.querySelectorAll( '[data-scene-a]' ) );
	const b = Array.from( entry.visual.querySelectorAll( '[data-scene-b]' ) );
	const c = Array.from( entry.visual.querySelectorAll( '[data-scene-c]' ) );
	const d = Array.from( entry.visual.querySelectorAll( '[data-scene-d]' ) );

	// A — inputs appear progressively after a restrained establish beat.
	a.forEach( ( node, index ) => animate( entry, node,
		{ opacity: [ .28, 1 ], filter: [ 'saturate(.55) brightness(.7)', 'saturate(1.15) brightness(1.12)', 'none' ], transform: [ 'translateY(4px)', 'translateY(0)' ] },
		360 + index * 210, 700 ) );

	// B — relationships arrive while the final inputs are still settling.
	b.forEach( ( node, index ) => animate( entry, node,
		{ opacity: [ .08, 1 ], strokeDashoffset: [ '40', '0' ], filter: [ 'drop-shadow(0 0 0 #63aaff)', 'drop-shadow(0 0 7px #63aaff)', 'none' ] },
		1250 + index * 170, 1050 ) );

	// C — analysis fills only after the first incoming signals reach it.
	c.forEach( ( node, index ) => animate( entry, node,
		{ opacity: [ .32, 1 ], filter: [ 'saturate(.6) brightness(.72)', 'saturate(1.08) brightness(1.08)', 'none' ], transform: [ 'translateY(3px)', 'translateY(0)' ] },
		2500 + index * 260, 980 ) );
	entry.visual.querySelectorAll( '[data-scene-bar]' ).forEach( ( node, index ) => animate( entry, node,
		{ transform: [ 'scaleX(.06)', 'scaleX(1)' ], transformOrigin: [ '100% 50%', '100% 50%' ] }, 2820 + index * 105, 900 ) );
	entry.visual.querySelectorAll( '[data-scene-line]' ).forEach( ( node, index ) => animate( entry, node,
		{ strokeDasharray: [ '1', '1' ], strokeDashoffset: [ '1', '0' ], opacity: [ .2, 1 ] }, 2920 + index * 120, 980 ) );
	entry.visual.querySelectorAll( '[data-scene-chart]' ).forEach( node => animate( entry, node,
		{ transform: [ 'rotate(-38deg) scale(.72)', 'rotate(0) scale(1)' ], opacity: [ .28, 1 ] }, 3000, 1050 ) );

	// D — the business observation gets the longest, strongest restrained beat.
	d.forEach( ( node, index ) => animate( entry, node,
		{ opacity: [ .22, 1 ], filter: [ 'saturate(.35) brightness(.65) drop-shadow(0 0 0 #eb4dd8)', 'saturate(1.2) brightness(1.16) drop-shadow(0 0 14px #eb4dd8)', 'none' ], transform: [ 'scale(.985)', 'scale(1.012)', 'scale(1)' ] },
		4050 + index * 180, 1450 ) );

	if ( entry.kind === 'communications' ) {
		entry.visual.querySelectorAll( '[data-message-hit]' ).forEach( ( node, index ) => {
			animate( entry, node, { color: [ '#aebbd0', '#ffd0f8' ], backgroundColor: [ 'transparent', '#a82b9a3d' ] }, 4300 + index * 130, 1050 );
		} );
	}

	// A no-op WAAPI clock keeps the whole causal sequence at the approved 6.8 seconds.
	const timeline = animate( entry, entry.visual, { opacity: [ 1, 1 ] }, 0, 6800 );
	timeline.finished.then( () => {
		if ( entry.active && entry.animations.includes( timeline ) ) { setComplete( entry ); }
	} ).catch( () => {} );
}

function queueEntry( entry, activeId ) {
	cancelAnimations( entry );
	entry.finished = false;
	entry.active = activeId === labels[ entry.kind ];
	entry.visual.querySelectorAll( '[data-message-hit]' ).forEach( node => node.classList.remove( 'is-message-hit' ) );
	entry.visual.removeAttribute( 'data-scene-stopped' );
	entry.stop.disabled = false;
	entry.stop.textContent = 'עצירת אנימציה';

	if ( ! entry.active ) {
		entry.visual.removeAttribute( 'data-scene-state' );
		return;
	}
	if ( entry.media.matches ) {
		setComplete( entry );
		return;
	}
	entry.visual.dataset.sceneState = 'waiting';
	entry.frame = window.requestAnimationFrame( () => updatePlayback( entry ) );
}

export function queueBatchAScene( root, activeId ) {
	const entries = root && scenes.get( root );
	if ( ! entries ) { return; }
	entries.forEach( entry => queueEntry( entry, activeId ) );
}

export function initBatchAScenes( root, activeId ) {
	if ( ! root || scenes.has( root ) || ! ( 'IntersectionObserver' in window ) || ! Element.prototype.animate ) { return; }
	const visuals = Array.from( root.querySelectorAll( '[data-section5-scene]' ) );
	if ( ! visuals.length ) { return; }
	const media = window.matchMedia( '(prefers-reduced-motion: reduce)' );
	const entries = visuals.map( visual => {
		const entry = {
			visual,
			kind: visual.dataset.section5Scene,
			panel: visual.closest( '.scooper-verticals__panel' ),
			stop: visual.querySelector( '[data-scene-stop]' ),
			media,
			animations: [],
			active: false,
			started: false,
			finished: false,
			frame: 0,
		};
		entry.stop.addEventListener( 'click', () => setComplete( entry, true ) );
		return entry;
	} );
	const observer = new IntersectionObserver( records => records.forEach( record => {
		const entry = entries.find( item => item.visual === record.target );
		if ( entry ) { updatePlayback( entry ); }
	} ), { threshold: [ 0, .25, .48, .72, 1 ] } );
	entries.forEach( entry => observer.observe( entry.visual ) );
	const onMotionChange = () => queueBatchAScene( root, entries.find( entry => entry.active )?.kind || '' );
	const onVisibility = () => entries.forEach( updatePlayback );
	media.addEventListener( 'change', onMotionChange );
	document.addEventListener( 'visibilitychange', onVisibility );
	scenes.set( root, entries );
	queueBatchAScene( root, activeId );
}
