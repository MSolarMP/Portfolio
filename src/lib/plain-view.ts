/**
 * "Plain view" strips the decoration (stains, gems, stitching, animation) for a quick skim.
 * The choice lives in localStorage and is applied as `<html data-view="plain">`
 * by an inline script before first paint, so there's no flash and no cookie read
 * (a cookie would make every page dynamic).
 */
export const PLAIN_VIEW_KEY = "view";

export const plainViewScript = `(function(){try{if(localStorage.getItem("${PLAIN_VIEW_KEY}")==="plain")document.documentElement.dataset.view="plain"}catch(e){}})()`;
