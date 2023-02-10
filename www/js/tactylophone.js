class Tactylophone {
    #context = null;

    #osc = {
        instance: false,
        enabled: false,
        tuning: 1
    };

    #vibrato = {
        instance: false,
        enabled: false
    };

    constructor(frequencies, tuningModes){
        this.frequencies = frequencies;
        this.tuningModes = tuningModes;
    };
    
    osc = {
        play: (note) => {
            if(!note) return;
            if(!this.#osc.enabled) return;
            if(!this.#context) this.#context = new AudioContext();
            
            const freq = this.frequencies[note];
            const osc = this.#context.createOscillator();
            const envelope = this.#context.createGain();
            
            if(this.#osc.instance) this.#osc.instance.disconnect();
    
            osc.type = "square";
            osc.frequency.value = freq * this.#osc.tuning;
            envelope.gain.value = 0.3;
    
            osc.connect(envelope);
            envelope.connect(this.#context.destination);
            osc.start();
            
            this.#osc.instance = osc;
            this.#vibrato.enabled && this.vibrato.start();
        },    
        stop: () => {
            if(!this.#osc.instance) return;
            this.#osc.instance.stop();
            this.#osc.instance.disconnect(); 
        },
        toggle: () => {
            this.#osc.enabled = !this.#osc.enabled;
            if(!this.#osc.enabled) this.osc.stop();
        }
    }

    vibrato = {
        start: () => {
            if(!this.#context || !this.#osc.instance || !this.#osc.enabled) return;
        
            const oscillator = this.#context.createOscillator();
            const envelopeEffect = this.#context.createGain();
            
            if(this.#vibrato.instance) this.#vibrato.instance.disconnect();
    
            oscillator.frequency.value = 5;
            envelopeEffect.gain.value = 5;
           
            oscillator.connect(envelopeEffect).connect(this.#osc.instance.frequency);
            oscillator.start();
            
            this.#vibrato.instance = oscillator;
        },
        stop: () => {        
            if(!this.#vibrato.instance) return;
            this.#vibrato.instance.stop();
            this.#vibrato.instance.disconnect();
        },
        toggle: () => {
            this.#vibrato.enabled = !this.#vibrato.enabled;
            if(!this.#vibrato.enabled) this.vibrato.stop();
            else this.vibrato.start();
        }
    }

    get hasPower(){
        return this.#osc.enabled;
    }

    get hasVibrato(){
        return this.#vibrato.enabled;
    }

    set tuning(value){
        if(!this.tuningModes.includes(value)) return;
        if(this.#osc.instance) this.#osc.instance.frequency.value = (this.#osc.instance.frequency.value / this.#osc.tuning) * value;
        this.#osc.tuning = value;
    }
}

export default Tactylophone;