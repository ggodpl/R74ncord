export class NegativeCache<T> {
    private cache: Set<T> = new Set();

    invalidateValue(v: T) {
        this.cache.delete(v);
    }

    invalidate() {
        this.cache.clear();
    }

    store(v: T) {
        this.cache.add(v);
    }

    isnt(v: T) {
        return this.cache.has(v);
    }
}