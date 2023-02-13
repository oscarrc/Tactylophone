import { APPROVED, FREQUENCIES, TUNING_MODES } from "./constants.js";
import { checkFullscreen, requestFullscreen } from "./helpers.js";

import PWA from "./pwa.js";
import Tactylophone from "./tactylophone.js";

const app = {
    tactylophone: new Tactylophone(FREQUENCIES, TUNING_MODES),
    pwa: new PWA(),
    synth: {    
        active: false,
        touchId: null,
        keyId: null,
        keys: {
            mouseEvents: {
                mousedown(e){
                    const note = e.target.getAttribute("data-key");
                    app.synth.active = true;
                    app.tactylophone.osc.play(note);
                },
                mouseup(){
                    app.synth.active = false
                    app.tactylophone.osc.stop()
                },
                mouseenter(e){
                    const note = e.target.getAttribute("data-key");
                    app.synth.active && app.tactylophone.osc.play(note)
                },
                mouseleave(){ app.tactylophone.osc.stop() }
            },
            touchEvents: {
                touchstart(e){
                    const touch = e.touches[0];
                    const target = document.elementFromPoint(touch.pageX,touch.pageY);    
                    const note = target.getAttribute("data-key");    
                    
                    if(touch.identifier !== app.synth.touchId && app.synth.touchId !== null) return;
                    
                    app.synth.touchId = touch.identifier;
                    app.synth.keyId = target?.id;
                    
                    app.tactylophone.osc.play(note);
                },
                touchmove(e){
                    const touch = Object.values(e.changedTouches).filter(t => t.identifier === app.synth.touchId)?.[0];
                    if(!touch) return;
                
                    const target = document.elementFromPoint(touch.pageX,touch.pageY);
                    const note = target?.getAttribute("data-key");
            
                    if(target?.id === app.synth.keyId) return;
            
                    app.synth.keyId = target?.id;
                    
                    app.tactylophone.osc.stop();
                    app.tactylophone.osc.play(note);
                },
                touchend(e){
                    if(Object.values(e.changedTouches).filter( t => t.identifier === app.synth.touchId).length === 0 ) return;
                    app.synth.touchId = null;
                    app.tactylophone.osc.stop()
                }
            },
            init(){
                const keys = document.getElementsByClassName("key");
                const keyboard = document.getElementById("keys");
                
                // Mouse events
                keyboard.addEventListener("mouseleave", () => {
                    app.synth.active = false;
                    app.tactylophone.osc.stop();
                });

                Object.values(keys).forEach( key => {
                    Object.keys(this.mouseEvents).forEach( event => {
                        key.addEventListener(event, this.mouseEvents[event], { pasive: false })
                    })
                })

                // Touch events
                Object.keys(this.touchEvents).map( event => {
                    keyboard.addEventListener(event, this.touchEvents[event], { passive: true });
                })
            }
        },
        toggles: {            
            keyboardBindings: {
                v(e){ app.synth.toggles.vibrato.toggle(e) },
                p(e){ app.synth.toggles.power.toggle(e) },
                1(v){ app.synth.tune(v) },
                2(v){ app.synth.tune(v) },
                3(v){ app.synth.tune(v) },
                init(){
                    document.addEventListener("keydown", (e) => {
                        const lowercaseKey = e.key.toLowerCase();
                        if(!Object.keys(this).includes(lowercaseKey)) return;
                        this[lowercaseKey](e);
                    })
                }
            },
            power: {
                init(){
                    document.getElementById("power-switch").addEventListener("click", this.toggle);
                    document.getElementById("power-switch").addEventListener("touchstart", this.toggle, { passive: false });
                
                },
                toggle(e){
                    if (e.type === "touchstart") e.preventDefault();    
                    app.tactylophone.osc.toggle();        
                    document.getElementById("power-handle").setAttribute("y", app.tactylophone.hasPower ? 308.6 : 283.6);
                    document.getElementById("power-switch").setAttribute("aria-checked", app.tactylophone.hasPower);
                }
            },
            vibrato: {
                init(){
                    document.getElementById("vibrato-switch").addEventListener("click", this.toggle);
                    document.getElementById("vibrato-switch").addEventListener("touchstart", this.toggle, { passive: false });
                
                },
                toggle(e){
                    if (e.type === "touchstart") e.preventDefault();
                    app.tactylophone.vibrato.toggle();                   
                    document.getElementById("vibrato-handle").setAttribute("y", app.tactylophone.hasVibrato ? 308.6 : 283.6);
                    document.getElementById("vibrato-switch").setAttribute("aria-checked", app.tactylophone.hasVibrato);
                }
            },
            tuning: {
                init(){
                    const toggle = document.getElementsByClassName("toggle-value");    
                    Object.values(toggle).forEach( t => {
                        t.addEventListener("touchstart", app.synth.tune, { passive: false });
                        t.addEventListener("change", app.synth.tune)
                    })
                },
            }
        },            
        tune(e){
            let mode = parseFloat(e.target.value);
    
            if(e.type === "touchstart"){
                e.preventDefault();
                e.target.checked = true;
            };
    
            if(e.type === "keydown"){
                mode = TUNING_MODES[e.key - 1];
                document.querySelector(`.toggle-value[value='${mode}']`).checked = true;
            }
    
            app.tactylophone.tuning = mode;
        },
        init(){
            this.keys.init();
            Object.values(this.toggles).forEach(t => t.init());
            
            window.addEventListener("blur", () => { 
                app.tactylophone.osc.stop(); 
                this.active = false
            });
        }
    },
    buttons: {
        fullscreen: document.getElementById("fullscreen"),
        pwa: document.getElementById("pwa"),
        kofi: document.getElementById("ko-fi"),
        more: document.getElementById("fab-more"),
        info: document.getElementById("info"),
        init(){
            if(app.pwa.isTWA && !APPROVED) this.kofi.remove();

            this.fullscreen.remove();
            if(supportsFullscreen()){                
                this.info.parentNode.insertBefore(this.fullscreen, this.info.nextSibling)
                this.fullscreen.addEventListener("click", app.fullscreen.toggle)
            }

            this.pwa.remove();            
            window.addEventListener("installable", (e) => {
                if(!e.detail) return
                
                this.more.append(this.pwa);
                this.pwa.addEventListener("click", app.pwa.install);
                
            }) 
        }
    },
    fullscreen:{
        icons: {
            fullscreen: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M290 236.4l43.9-43.9a8.01 8.01 0 0 0-4.7-13.6L169 160c-5.1-.6-9.5 3.7-8.9 8.9L179 329.1c.8 6.6 8.9 9.4 13.6 4.7l43.7-43.7L370 423.7c3.1 3.1 8.2 3.1 11.3 0l42.4-42.3c3.1-3.1 3.1-8.2 0-11.3L290 236.4zm352.7 187.3c3.1 3.1 8.2 3.1 11.3 0l133.7-133.6 43.7 43.7a8.01 8.01 0 0 0 13.6-4.7L863.9 169c.6-5.1-3.7-9.5-8.9-8.9L694.8 179c-6.6.8-9.4 8.9-4.7 13.6l43.9 43.9L600.3 370a8.03 8.03 0 0 0 0 11.3l42.4 42.4zM845 694.9c-.8-6.6-8.9-9.4-13.6-4.7l-43.7 43.7L654 600.3a8.03 8.03 0 0 0-11.3 0l-42.4 42.3a8.03 8.03 0 0 0 0 11.3L734 787.6l-43.9 43.9a8.01 8.01 0 0 0 4.7 13.6L855 864c5.1.6 9.5-3.7 8.9-8.9L845 694.9zm-463.7-94.6a8.03 8.03 0 0 0-11.3 0L236.3 733.9l-43.7-43.7a8.01 8.01 0 0 0-13.6 4.7L160.1 855c-.6 5.1 3.7 9.5 8.9 8.9L329.2 845c6.6-.8 9.4-8.9 4.7-13.6L290 787.6 423.7 654c3.1-3.1 3.1-8.2 0-11.3l-42.4-42.4z"></path></svg>',
            restore: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M391 240.9c-.8-6.6-8.9-9.4-13.6-4.7l-43.7 43.7L200 146.3a8.03 8.03 0 0 0-11.3 0l-42.4 42.3a8.03 8.03 0 0 0 0 11.3L280 333.6l-43.9 43.9a8.01 8.01 0 0 0 4.7 13.6L401 410c5.1.6 9.5-3.7 8.9-8.9L391 240.9zm10.1 373.2L240.8 633c-6.6.8-9.4 8.9-4.7 13.6l43.9 43.9L146.3 824a8.03 8.03 0 0 0 0 11.3l42.4 42.3c3.1 3.1 8.2 3.1 11.3 0L333.7 744l43.7 43.7A8.01 8.01 0 0 0 391 783l18.9-160.1c.6-5.1-3.7-9.4-8.8-8.8zm221.8-204.2L783.2 391c6.6-.8 9.4-8.9 4.7-13.6L744 333.6 877.7 200c3.1-3.1 3.1-8.2 0-11.3l-42.4-42.3a8.03 8.03 0 0 0-11.3 0L690.3 279.9l-43.7-43.7a8.01 8.01 0 0 0-13.6 4.7L614.1 401c-.6 5.2 3.7 9.5 8.8 8.9zM744 690.4l43.9-43.9a8.01 8.01 0 0 0-4.7-13.6L623 614c-5.1-.6-9.5 3.7-8.9 8.9L633 783.1c.8 6.6 8.9 9.4 13.6 4.7l43.7-43.7L824 877.7c3.1 3.1 8.2 3.1 11.3 0l42.4-42.3c3.1-3.1 3.1-8.2 0-11.3L744 690.4z"></path></svg>'
        },
        toggle(){
            if(requestFullscreen()){
                app.buttons.fullscreen.innerHTML = app.fullscreen.icons.fullscreen
                app.buttons.fullscreen.setAttribute("data-tooltip", "Fullscreen");
            }else{
                app.buttons.fullscreen.innerHTML = app.fullscreen.icons.restore
                app.buttons.fullscreen.setAttribute("data-tooltip", "Restore");
            }
        }
    },
    loader(){
        const loader = document.getElementById("loader");
        const logo = document.getElementById("tactylophone-logo");
        
        if(app.pwa.isTWA || app.pwa.isPWA) return loader.remove();
        
        if("onanimationend" in logo){
            logo.addEventListener("animationend", () => {
                loader.style.opacity = 0;

                if("ontransitionend" in loader){ 
                    loader.addEventListener("transitionend", () => {
                        document.getElementById("main").style.opacity = 1;
                        loader.remove();
                    })     
                }else{
                    document.getElementById("main").style.opacity = 1;
                    loader.remove();
                }           
            }, false);
        }else{
            loader.remove();
        }
    },
    init(){
        this.loader();
        this.buttons.init();
        this.synth.init();
    }
}

navigator.serviceWorker.register("worker.js", { scope: '/' });
app.init();