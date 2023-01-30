/**
 * @fileoverview Traverser to traverse AST trees.
 * @author Nicholas C. Zakas
 * @author Toru Nagashima
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import { ASTNode } from "@eslint/types";
import Debug from "debug";
import { KEYS, getKeys as visitorGetKeys, VisitorKeys } from "eslint-visitor-keys";

const debug = Debug("eslint:traverser");

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Do nothing.
 * @returns {void}
 */
function noop() {
    // do nothing.
}

/**
 * Check whether the given value is an ASTNode or not.
 * @param {any} x The value to check.
 * @returns {boolean} `true` if the value is an ASTNode.
 */
function isNode(x: any) {
    return x !== null && typeof x === "object" && typeof x.type === "string";
}

/**
 * Get the visitor keys of a given node.
 * @param {Object} visitorKeys The map of visitor keys.
 * @param {ASTNode} node The node to get their visitor keys.
 * @returns {string[]} The visitor keys of the node.
 */
function getVisitorKeys(visitorKeys: Record<string, readonly string[]>, node: ASTNode) {
    let keys = visitorKeys[node.type];

    if (!keys) {
        keys = [...visitorGetKeys(node)];
        debug('Unknown node type "%s": Estimated visitor keys %j', node.type, keys);
    }

    return keys;
}

/**
 * The traverser class to traverse AST trees.
 */
class Traverser {
    _current: ASTNode | null;
    _parents: ASTNode[] = [];
    _skipped = false;
    _broken = false;
    _visitorKeys: VisitorKeys | null;
    _enter: ((...args: any) => any) | null;
    _leave: ((...args: any) => any) | null;
    constructor() {
        this._current = null;
        this._parents = [];
        this._skipped = false;
        this._broken = false;
        this._visitorKeys = null;
        this._enter = null;
        this._leave = null;
    }

    /**
     * Gives current node.
     * @returns {ASTNode} The current node.
     */
    current() {
        return this._current;
    }

    /**
     * Gives a copy of the ancestor nodes.
     * @returns {ASTNode[]} The ancestor nodes.
     */
    parents() {
        return this._parents.slice(0);
    }

    /**
     * Break the current traversal.
     * @returns {void}
     */
    break() {
        this._broken = true;
    }

    /**
     * Skip child nodes for the current traversal.
     * @returns {void}
     */
    skip() {
        this._skipped = true;
    }

    /**
     * Traverse the given AST tree.
     * @param {ASTNode} node The root node to traverse.
     * @param {Object} options The option object.
     * @param {Object} [options.visitorKeys=DEFAULT_VISITOR_KEYS] The keys of each node types to traverse child nodes. Default is `./default-visitor-keys.json`.
     * @param {Function} [options.enter=noop] The callback function which is called on entering each node.
     * @param {Function} [options.leave=noop] The callback function which is called on leaving each node.
     * @returns {void}
     */
    traverse(
        node: ASTNode,
        options: {
            visitorKeys: VisitorKeys;
            enter?: (...args: any) => any;
            leave?: (...args: any) => any;
        }
    ) {
        this._current = null;
        this._parents = [];
        this._skipped = false;
        this._broken = false;
        this._visitorKeys = options.visitorKeys || KEYS;
        this._enter = options.enter || noop;
        this._leave = options.leave || noop;
        this._traverse(node, null);
    }

    /**
     * Traverse the given AST tree recursively.
     * @param {ASTNode} node The current node.
     * @param {ASTNode|null} parent The parent node.
     * @returns {void}
     * @private
     */
    _traverse(node: ASTNode, parent: ASTNode | null) {
        if (!isNode(node)) {
            return;
        }

        this._current = node;
        this._skipped = false;
        this._enter?.(node, parent);

        if (!this._skipped && !this._broken) {
            const keys = getVisitorKeys(this._visitorKeys ?? Traverser.DEFAULT_VISITOR_KEYS, node);

            if (keys.length >= 1) {
                this._parents.push(node);
                for (let i = 0; i < keys.length && !this._broken; ++i) {
                    // @ts-expect-error
                    const child = node[keys[i]];

                    if (Array.isArray(child)) {
                        for (let j = 0; j < child.length && !this._broken; ++j) {
                            this._traverse(child[j], node);
                        }
                    } else {
                        this._traverse(child, node);
                    }
                }
                this._parents.pop();
            }
        }

        if (!this._broken) {
            this._leave?.(node, parent);
        }

        this._current = parent;
    }

    /**
     * Calculates the keys to use for traversal.
     * @param {ASTNode} node The node to read keys from.
     * @returns {string[]} An array of keys to visit on the node.
     * @private
     */
    static getKeys(node: ASTNode) {
        return visitorGetKeys(node);
    }

    /**
     * Traverse the given AST tree.
     * @param {ASTNode} node The root node to traverse.
     * @param {Object} options The option object.
     * @param {Object} [options.visitorKeys=DEFAULT_VISITOR_KEYS] The keys of each node types to traverse child nodes. Default is `./default-visitor-keys.json`.
     * @param {Function} [options.enter=noop] The callback function which is called on entering each node.
     * @param {Function} [options.leave=noop] The callback function which is called on leaving each node.
     * @returns {void}
     */
    static traverse(
        node: ASTNode,
        options: {
            visitorKeys: VisitorKeys;
            enter?: (...args: any) => any;
            leave?: (...args: any) => any;
        }
    ) {
        new Traverser().traverse(node, options);
    }

    /**
     * The default visitor keys.
     * @type {Object}
     */
    static get DEFAULT_VISITOR_KEYS() {
        return KEYS;
    }
}

export = Traverser;
