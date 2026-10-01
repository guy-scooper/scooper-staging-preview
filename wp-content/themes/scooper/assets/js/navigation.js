( function () {
 'use strict';
 var header = document.querySelector( '.scooper-site-header' );
 if ( ! header ) { return; }
 var menu = header.querySelector( '.wp-block-navigation__responsive-container' );
 if ( ! menu ) { return; }
 var background = Array.from( document.querySelectorAll( '.wp-site-blocks > :not(.wp-block-template-part), .scooper-wordmark, .scooper-header-cta' ) );
 var previous = new Map();
 function sync() {
  var open = menu.classList.contains( 'is-menu-open' );
  background.forEach( function ( element ) {
   if ( element.contains( menu ) ) { return; }
   if ( open ) {
    if ( ! previous.has( element ) ) { previous.set( element, element.inert ); }
    element.inert = true;
   } else if ( previous.has( element ) ) {
    element.inert = previous.get( element ); previous.delete( element );
   }
  } );
 }
 new MutationObserver( sync ).observe( menu, { attributes: true, attributeFilter: [ 'class' ] } ); sync();
}() );

( function () {
 'use strict';
 var header = document.querySelector( '.scooper-site-header' );
 if ( ! header ) { return; }
 var sections = [ 'solutions', 'verticals', 'testimonials', 'faq' ].map( function ( id ) {
  var target = document.getElementById( id );
  var link = header.querySelector( '.scooper-nav a[href="#' + id + '"]' );
  return target && link ? { target: target, link: link } : null;
 } ).filter( Boolean );
 if ( ! sections.length ) { return; }
 var current = -1;
 var pending = false;
 var menu = header.querySelector( '.wp-block-navigation__responsive-container' );
 function update() {
  pending = false;
  // The modal temporarily changes the page's scroll position; retain its section.
  if ( menu && menu.classList.contains( 'is-menu-open' ) ) { return; }
  // Match native anchor clearance and keep a small dead band at boundaries.
  var clearance = parseFloat( getComputedStyle( document.documentElement ).scrollPaddingTop ) || 0;
  var line = Math.max( header.getBoundingClientRect().bottom, clearance ) + 8;
  var tops = sections.map( function ( section ) { return section.target.getBoundingClientRect().top; } );
  var next = -1;
  tops.forEach( function ( top, index ) { if ( top <= line ) { next = index; } } );
  if ( next > current && tops[ next ] > line - 4 ) { return; }
  if ( next < current && tops[ current ] <= line + 4 ) { return; }
  if ( next === current ) { return; }
  sections.forEach( function ( section, index ) {
   if ( index === next ) { section.link.setAttribute( 'aria-current', 'location' ); }
   else { section.link.removeAttribute( 'aria-current' ); }
  } );
  current = next;
 }
 function schedule() {
  if ( ! pending ) { pending = true; requestAnimationFrame( update ); }
 }
 window.addEventListener( 'scroll', schedule, { passive: true } );
 window.addEventListener( 'resize', schedule );
 window.addEventListener( 'hashchange', schedule );
 window.addEventListener( 'pageshow', schedule );
 if ( menu ) {
  new MutationObserver( schedule ).observe( menu, { attributes: true, attributeFilter: [ 'class' ] } );
 }
 if ( 'ResizeObserver' in window ) {
  var observer = new ResizeObserver( schedule );
  observer.observe( header );
  sections.forEach( function ( section ) { observer.observe( section.target ); } );
 }
 update();
}() );
