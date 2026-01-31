/* tslint:disable */
/* eslint-disable */

/**
 * Wasm-bindgen wrapper for SearchEngine
 */
export class WasmSearchEngine {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Create a new search engine from JSON product data
     */
    constructor(products_json: string);
    /**
     * Get total product count
     */
    product_count(): number;
    /**
     * Search products and return results as JSON
     */
    search(query: string, limit: number): any;
}

export function init_panic_hook(): void;

/**
 * Standalone search function (alternative API)
 */
export function search_products(products_json: string, query: string, limit: number): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_wasmsearchengine_free: (a: number, b: number) => void;
    readonly init_panic_hook: () => void;
    readonly search_products: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly wasmsearchengine_new: (a: number, b: number, c: number) => void;
    readonly wasmsearchengine_product_count: (a: number) => number;
    readonly wasmsearchengine_search: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
