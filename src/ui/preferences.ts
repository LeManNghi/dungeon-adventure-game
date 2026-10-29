export type Preferences = {sound:boolean;volume:number;reducedMotion:boolean;introduced:boolean}
const key='tanhoa.settings.v1'
export function loadPreferences():Preferences {
  const defaults:Preferences={sound:true,volume:.25,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,introduced:false}
  try {
    const saved=JSON.parse(localStorage.getItem(key)??'{}')
    if(typeof saved?.sound==='boolean')defaults.sound=saved.sound
    if(typeof saved?.volume==='number'&&Number.isFinite(saved.volume))defaults.volume=Math.max(0,Math.min(1,saved.volume))
    if(typeof saved?.reducedMotion==='boolean')defaults.reducedMotion=saved.reducedMotion
    if(typeof saved?.introduced==='boolean')defaults.introduced=saved.introduced
  } catch { /* Private browsing or invalid saved settings use defaults. */ }
  return defaults
}
export function savePreferences(settings:Preferences) {try {localStorage.setItem(key,JSON.stringify(settings))}catch {/* Settings still work for this session. */}}
