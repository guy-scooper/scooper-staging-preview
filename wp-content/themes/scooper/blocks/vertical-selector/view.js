import { initAutomotiveJourney, queueAutomotiveJourney } from './automotive.js?ver=1.3.20';
import { initBatchAScenes, queueBatchAScene } from './batch-a-visuals.js?ver=1.3.20';
import { getContext, getElement, store, withSyncEvent } from '@wordpress/interactivity';

// Reusable two-source case stage; all content remains static until enhancement succeeds.
const municipalReveals = new WeakMap();

function stopMunicipalReveal( entry ) {
 if ( ! entry ) { return; }
 entry.timers.forEach( window.clearTimeout );
 entry.timers = [];
 entry.cards.forEach( card => {
  card.classList.remove( 'is-revealing', 'is-armed' );
  card.removeAttribute( 'data-case-preparing' );
  card.querySelectorAll( '[data-reveal-step]' ).forEach( step => step.classList.remove( 'is-shown' ) );
 } );
}

function maybeRevealMunicipalCase( root ) {
 const entry = municipalReveals.get( root );
 if ( ! entry || ! entry.armed || entry.started || window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ) { return; }
 const panel = entry.stage.closest( '.scooper-verticals__panel' );
 const bounds = entry.stage.getBoundingClientRect();
 const visible = Math.max( 0, Math.min( bounds.bottom, window.innerHeight ) - Math.max( bounds.top, 0 ) );
 // Target the actual stage. Extremely tall stages wait for 90% of the viewport instead.
 const requiredVisible = Math.min( bounds.height * 0.58, window.innerHeight * 0.9 );
 if ( ! panel || ! panel.classList.contains( 'is-active' ) || visible < requiredVisible ) { return; }
 entry.started = true;
 const card = entry.card;
 const css = window.getComputedStyle( entry.stage );
 const duration = parseFloat( css.getPropertyValue( '--case-reveal-duration' ) ) || 600;
 const stagger = parseFloat( css.getPropertyValue( '--case-reveal-stagger' ) ) || 650;
 const first = parseFloat( css.getPropertyValue( '--case-reveal-first' ) ) || 300;
 const steps = Array.from( card.querySelectorAll( '[data-reveal-step]' ) );
 const stages = Array.from( new Set( steps.map( step => Number( step.dataset.revealStep ) ) ) ).sort( ( a, b ) => a - b );
 // Hold the prepared groups for 300ms, then reveal five meaningful stages at 650ms intervals.
 entry.timers.push( window.setTimeout( () => {
  if ( entry.armed && entry.card === card ) { card.classList.remove( 'is-armed' ); card.classList.add( 'is-revealing' ); card.removeAttribute( 'data-case-preparing' ); }
 }, first ) );
 stages.forEach( ( stage, index ) => {
  entry.timers.push( window.setTimeout( () => {
   if ( entry.armed && entry.card === card && panel.classList.contains( 'is-active' ) ) {
    steps.filter( step => Number( step.dataset.revealStep ) === stage ).forEach( step => step.classList.add( 'is-shown' ) );
   }
  }, first + index * stagger ) );
 } );
 entry.timers.push( window.setTimeout( () => {
  if ( entry.card === card ) { card.classList.remove( 'is-revealing' ); }
  entry.timers = [];
 }, first + ( stages.length - 1 ) * stagger + duration + 50 ) );
}

function queueMunicipalReveal( root, activeId, source ) {
 const entry = root && municipalReveals.get( root );
 if ( ! entry ) { return; }
 stopMunicipalReveal( entry );
 if ( source ) { entry.source = source; }
 entry.card = entry.cards.find( card => card.dataset.case === entry.source );
 entry.armed = activeId === 'municipalities';
 entry.started = false;
 if ( entry.armed && ! window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ) {
  entry.card.classList.add( 'is-armed' );
  // Interactivity updates the selected class list; keep preparation independent of it.
  entry.card.setAttribute( 'data-case-preparing', '' );
 }
 if ( entry.armed ) { window.requestAnimationFrame( () => maybeRevealMunicipalCase( root ) ); }
}

function revealTab( tab, shouldFocus = false ) {
	if ( ! tab ) {
		return;
	}

	if ( shouldFocus ) {
		tab.focus( { preventScroll: true } );
	}

	const rail = tab.closest( '.scooper-verticals__tabs' );
	if ( rail && rail.scrollWidth > rail.clientWidth ) {
		const tabBox = tab.getBoundingClientRect();
		const railBox = rail.getBoundingClientRect();
		const distance = tabBox.left < railBox.left ? tabBox.left - railBox.left - 8 :
			( tabBox.right > railBox.right ? tabBox.right - railBox.right + 8 : 0 );
		rail.scrollBy( { left: distance, behavior: 'instant' } );
	}
}

store( 'scooper/vertical-selector', {
	state: {
		get isSourceSelected() { const context = getContext(); return context.caseSource === context.sourceId; },
		get isSourceHidden() { const context = getContext(); return context.caseSource !== context.sourceId; },
		get isBenefitOpen() { const context = getContext(); return ! context.enhanced || context.openBenefit === context.benefitIndex; },
		get isBenefitClosed() { const context = getContext(); return context.enhanced && context.openBenefit !== context.benefitIndex; },
		get isSelected() {
			const context = getContext();
			return context.activeId === context.itemId;
		},
		get isPanelHidden() {
			const context = getContext();
			return context.enhanced && context.activeId !== context.itemId;
		},
		get tabIndex() {
			const context = getContext();
			return context.activeId === context.itemId ? 0 : -1;
		},
	},
	actions: {
		selectSource: withSyncEvent( ( event ) => {
			const context = getContext();
			const root = event.currentTarget.closest( '.scooper-verticals' );
			// Prepare and commit the incoming case's hidden styles before activation.
			queueMunicipalReveal( root, context.activeId, context.sourceId );
			const entry = root && municipalReveals.get( root );
			if ( entry && entry.armed ) { entry.card.getBoundingClientRect(); }
			context.caseSource = context.sourceId;
		} ),
		toggleBenefit() { const context = getContext(); context.openBenefit = context.openBenefit === context.benefitIndex ? -1 : context.benefitIndex; },
		select( event ) {
			const context = getContext();
			context.activeId = context.itemId;
			revealTab( event.currentTarget );
			queueMunicipalReveal( event.currentTarget.closest( '.scooper-verticals' ), context.activeId );
			queueAutomotiveJourney( event.currentTarget.closest( '.scooper-verticals' ), context.activeId );
			queueBatchAScene( event.currentTarget.closest( '.scooper-verticals' ), context.activeId );
		},
		navigate: withSyncEvent( ( event ) => {
			const rail = event.currentTarget.closest( '.scooper-verticals__tabs' );
			const twoRowRail = rail && window.getComputedStyle( rail ).gridAutoFlow === 'column';
			const supportedKeys = [ 'ArrowLeft', 'ArrowRight', 'Home', 'End', ...( twoRowRail ? [ 'ArrowUp', 'ArrowDown' ] : [] ) ];
			if ( ! supportedKeys.includes( event.key ) ) {
				return;
			}

			event.preventDefault();

			const context = getContext();
			const root = event.currentTarget.closest( '.scooper-verticals' );
			const tabs = root ? Array.from( root.querySelectorAll( '[role="tab"]' ) ) : [];
			const currentIndex = context.itemIds.indexOf( context.itemId );
			const isRtl = root && window.getComputedStyle( root ).direction === 'rtl';
			let nextIndex = currentIndex;

			if ( event.key === 'Home' ) {
				nextIndex = 0;
			} else if ( event.key === 'End' ) {
				nextIndex = context.itemIds.length - 1;
			} else if ( event.key === 'ArrowUp' || event.key === 'ArrowDown' ) {
				nextIndex = currentIndex % 2 ? currentIndex - 1 : currentIndex + 1;
			} else {
				const visualStep = event.key === 'ArrowLeft' ? 1 : -1;
				const logicalStep = ( isRtl ? visualStep : -visualStep ) * ( twoRowRail ? 2 : 1 );
				nextIndex = ( currentIndex + logicalStep + context.itemIds.length ) % context.itemIds.length;
			}

			context.activeId = context.itemIds[ nextIndex ];
			revealTab( tabs[ nextIndex ], true );
			queueMunicipalReveal( root, context.activeId );
			queueAutomotiveJourney( root, context.activeId );
			queueBatchAScene( root, context.activeId );
		} ),
	},
	callbacks: {
		init() {
			const context = getContext();
			context.enhanced = true;
			const root = getElement().ref;
			initAutomotiveJourney( root, context.activeId );
			initBatchAScenes( root, context.activeId );
			const stage = root && root.querySelector( '.scooper-case-view__stage' );
			if ( stage && 'IntersectionObserver' in window ) {
				const observer = new IntersectionObserver( () => maybeRevealMunicipalCase( root ), { threshold: Array.from( { length: 101 }, ( _, i ) => i / 100 ) } );
				const cards = Array.from( stage.querySelectorAll( '.scooper-case-view__panel' ) );
				const entry = { stage, cards, card: cards[0], source: context.caseSource, observer, started: false, armed: false, timers: [] };
				municipalReveals.set( root, entry );
				window.matchMedia( '(prefers-reduced-motion: reduce)' ).addEventListener( 'change', event => { if ( event.matches ) { stopMunicipalReveal( entry ); entry.started = true; } } );
				queueMunicipalReveal( root, context.activeId, context.caseSource );
				observer.observe( stage );
			}
		},
	},
} );
