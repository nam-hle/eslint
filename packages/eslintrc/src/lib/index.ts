/**
 * @fileoverview Package exports for @eslint/eslintrc
 * @author Nicholas C. Zakas
 */
//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import environments from '../conf/environments.js';

import { CascadingConfigArrayFactory } from './cascading-config-array-factory.js';
import {
    ConfigDependency,
    ExtractedConfig,
    IgnorePattern,
    ConfigArray,
    getUsedExtractedConfigs,
    OverrideTester
} from './config-array/index.js';
import { ConfigArrayFactory, createContext as createConfigArrayFactoryContext } from './config-array-factory.js';
import { FlatCompat } from './flat-compat.js';
import * as ConfigOps from './shared/config-ops.js';
import ConfigValidator from './shared/config-validator.js';
import * as naming from './shared/naming.js';
import * as ModuleResolver from './shared/relative-module-resolver.js';
import {
    ConfigData,
    LintMessage,
    OverrideConfigData,
    Processor,
    Rule,
    ParseResult,
    Fix,
    RuleMeta,
    RuleMetaDocs,
    SeverityNumber,
    SuggestionResult,
    EcmaFeatures,
    ParserOptions,
    Parser,
    GlobalConf,
    SeverityConf,
    SeverityString,
    ScopeManager,
    EnvsMap,
    GlobalsMap,
    RuleConf,
    Environment,
    Plugin,
    DeprecatedRuleInfo,
    Settings
} from './shared/types.js';

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

const Legacy = {
    ConfigArray,
    createConfigArrayFactoryContext,
    CascadingConfigArrayFactory,
    ConfigArrayFactory,
    ConfigDependency,
    ExtractedConfig,
    IgnorePattern,
    OverrideTester,
    getUsedExtractedConfigs,
    environments,

    // shared
    ConfigOps,
    ConfigValidator,
    ModuleResolver,
    naming
};

export {
    Legacy,
    FlatCompat,
    type CascadingConfigArrayFactory,
    type ConfigData,
    type LintMessage,
    type OverrideConfigData,
    type Processor,
    type Rule,
    type ParseResult,
    type Fix,
    type RuleMeta,
    type Settings,
    type RuleMetaDocs,
    type SeverityNumber,
    type SuggestionResult,
    type EcmaFeatures,
    type ParserOptions,
    type ConfigArray,
    type Parser,
    type GlobalConf,
    type SeverityConf,
    type SeverityString,
    type ScopeManager,
    type ExtractedConfig,
    type EnvsMap,
    type GlobalsMap,
    type RuleConf,
    type Environment,
    type Plugin,
    type DeprecatedRuleInfo
};
