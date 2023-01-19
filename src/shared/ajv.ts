/**
 * @fileoverview The instance of Ajv validator.
 * @author Evgeny Poberezkin
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import Ajv from "ajv";
import metaSchema from "ajv/lib/refs/json-schema-draft-04.json";

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

export = (additionalOptions = {}) => {
    const ajv = new Ajv({
        meta: false,
        useDefaults: true,
        validateSchema: false,
        missingRefs: "ignore",
        verbose: true,
        schemaId: "auto",
        ...additionalOptions
    });

    ajv.addMetaSchema(metaSchema);
    // eslint-disable-next-line no-underscore-dangle -- Ajv's API
    // @ts-expect-error
    ajv._opts.defaultMeta = metaSchema.id;

    return ajv;
};
