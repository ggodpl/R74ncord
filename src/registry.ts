export class Registry<T> {
    registry: Map<string, T>;
    
    constructor () {
        this.registry = new Map();
    }

    register(name: string, entity: T) {
        this.registry.set(name, entity);
    }

    unregister(name: string) {
        this.registry.delete(name);
    }

    get(name: string) {
        return this.registry.get(name);
    }

    has(name: string) {
        return this.registry.has(name);
    }

    toArray() {
        return Array.from(this.registry.values());
    }
}