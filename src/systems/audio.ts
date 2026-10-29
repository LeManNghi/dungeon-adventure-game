import type { GameEvent } from '../game/types'
import type { Preferences } from '../ui/preferences'

/** Short synthesized cues; no network requests or autoplay before a gesture. */
export class GameAudio {
  private context?:AudioContext
  private output?:GainNode
  private settings:Preferences
  constructor(settings:Preferences) {this.settings=settings}
  unlock() {
    if(!this.settings.sound||!this.settings.volume)return
    try {
      if(!this.context) {this.context=new AudioContext();this.output=this.context.createGain();this.output.connect(this.context.destination)}
      this.update()
      if(this.context.state==='suspended')void this.context.resume().catch(()=>{})
    } catch { /* Audio is optional when unavailable. */ }
  }
  update() {if(this.output&&this.context)this.output.gain.setValueAtTime(this.settings.sound?this.settings.volume:0,this.context.currentTime)}
  suspend() {if(this.context?.state==='running')void this.context.suspend().catch(()=>{})}
  play(events:GameEvent[]) {
    const ctx=this.context,out=this.output
    if(!ctx||!out||ctx.state!=='running'||!this.settings.sound)return
    const tones:Record<GameEvent['type'],[number,number,number]>={step:[100,70,.035],attack:[230,90,.08],damage:[130,45,.12],pickup:[660,990,.10],heal:[420,740,.18],level:[660,1320,.25],telegraph:[250,450,.15],death:[140,35,.25],victory:[660,1320,.45],equip:[330,440,.07]}
    const audible=events.filter(e=>e.visible!==false)
    const chosen=[...new Map(audible.map(e=>[e.type,e])).values()].filter(e=>e.type!=='step'||audible.length===1).slice(-4)
    chosen.forEach((e,index)=>{
      const [from,to,duration]=tones[e.type],start=ctx.currentTime+index*.025,osc=ctx.createOscillator(),gain=ctx.createGain()
      osc.type=e.type==='step'?'sine':'triangle';osc.frequency.setValueAtTime(from,start);osc.frequency.exponentialRampToValueAtTime(to,start+duration)
      gain.gain.setValueAtTime(.001,start);gain.gain.exponentialRampToValueAtTime(.15,start+.008);gain.gain.exponentialRampToValueAtTime(.001,start+duration)
      osc.connect(gain);gain.connect(out);osc.start(start);osc.stop(start+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect()}
    })
  }
}
