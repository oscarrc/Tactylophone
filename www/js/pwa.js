class PWA{
    #installable = false;
    #installer = null;

    constructor(){
        window.addEventListener('beforeinstallprompt', (e) => {
            this.#installer = e
            this.#installable = true;
            this.isPWA = false
            window.dispatchEvent(new CustomEvent('installable', { detail: true }));
        });

        this.isPWA = true;
        this.isTWA = document.referrer.includes('android-app://me.oscarrc.tactylophone.twa');
    }

    get installable(){
        return this.#installable;
    }

    install = () => {
        this.#installer && this.#installer.prompt();
        this.#installer.userChoice.then((choiceResult) => {
            if(choiceResult.outcome === 'accepted') window.dispatchEvent(new CustomEvent('installable', { status: false }));
        });
    }
}

export default PWA;