export function assert(condition: unknown, onFailedMessage = "Condition return a falsely value."): asserts condition {
    if (!condition) {
        throw new Error(onFailedMessage);
    }
}
