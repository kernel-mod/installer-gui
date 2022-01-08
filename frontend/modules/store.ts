import {Component} from "preact";

export default class Store<S = any> {
    listeners: Set<Function> = new Set();

    emitChange(): void {
        const listeners = [...this.listeners];

        for (let i = 0; i < listeners.length; i++) {
            try {listeners[i]();}
            catch (error) {console.error(error);}
        }
    }

    addListener(listener: Function) {
        this.listeners.add(listener);
    }

    removeListener(listener: Function) {
        return this.listeners.delete(listener);
    }

    render(): any {return null;}
}