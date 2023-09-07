(function() {
    const { readTextFileSync, fileExistsSync } = require("yafs");
    const arrayPrototype = Array.prototype as any;
    if (!arrayPrototype.flatMap) {
        try {
            const flatMap = require("array.prototype.flatmap");
            flatMap.shim();
        } catch (e) {
            console.error(
                "Array.prototype.flatmap is required -- either use a newer Node or install the npm package array.prototype.flatmap"
            );
        }
    }
    const
        ZarroError = requireModule<ZarroError>("zarro-error"),
        chalk = requireModule<AnsiColors>("ansi-colors"),
        debug = requireModule<DebugFactory>("debug")(__filename),
        registeredEnvironmentVariables = {} as Dictionary<EnvRegistration>,
        longestStringLength = require("./longest-string-length"),
        padRight = require("./pad-right"),
        padLeft = require("./pad-left"),
        toExport = {
            flag,
            fallback,
            register,
            printHelp,
            taskHelp,
            resolve,
            resolveObject,
            associate,
            resolveArray,
            resolveMergedArray,
            explode,
            overrideDefault,
            resolveNumber,
            resolveFlag,
            resolveWithFallback,
            resolveMap,
            resolveRequired
        } as Dictionary<any>;

    const positives = new Set([ "1", "yes", "true" ]);
    if (process.env.POSITIVE_FLAG) {
        positives.add(process.env.POSITIVE_FLAG);
    }

    function flag(name: string, defaultValue: boolean | string): boolean {
        const envVar = fallback(name, `${ defaultValue }`);

        return positives.has((envVar || "").toLowerCase());
    }

    function fallback(name: string, defaultValue: string): string {
        const envVar = process.env[name];
        return envVar === undefined ? defaultValue : envVar;
    }

    function register(config: EnvRegistration) {
        let { name, help, tasks, overriddenBy, when } = config;
        if (toExport[name] !== undefined) {
            throw new ZarroError(`env var already registered: ${ name }`);
        }
        toExport[name] = name;
        // 'default' seems like a more natural name, but we can't use it for a var name...
        let fallback = config.default;
        if (registeredEnvironmentVariables[name]) {
            return update(name, fallback, help, tasks, overriddenBy, when);
        }
        tasks = normaliseArray(tasks);
        help = Array.isArray(help)
            ? trimAll(help)
            : trim(help);
        fallback = trim(fallback);

        registeredEnvironmentVariables[name] = {
            name,
            help,
            tasks,
            default: fallback,
            overriddenBy: overriddenBy || [],
            when
        };
        if (pendingAssociations[name]) {
            const otherTasks = pendingAssociations[name];
            delete pendingAssociations[name];
            tasks.push.apply(tasks, otherTasks);
        }
        if (pendingDefaultOverrides[name]) {
            registeredEnvironmentVariables[name].default =
                pendingDefaultOverrides[name];
            delete pendingDefaultOverrides[name];
        }
        debug({
                  label: `register env var: ${ name }`,
                  config: registeredEnvironmentVariables[name]
              });
        return toExport;
    }

    const pendingAssociations = {} as Dictionary<any>;

    function associate(varName: string | string[], tasks: string | string[]) {
        if (Array.isArray(varName)) {
            varName.forEach(v => associate(v, tasks));
            return toExport;
        }

        if (!varName || !tasks || tasks.length === 0) {
            return toExport;
        }
        if (!Array.isArray(tasks)) {
            tasks = [ tasks ];
        }

        const target = registeredEnvironmentVariables[varName]
            ? registeredEnvironmentVariables[varName].tasks
            : (pendingAssociations[varName] = pendingAssociations[varName] || []);
        tasks.forEach(task => {
            if (target.indexOf(task) > -1) {
                return;
            }
            target.push(task);
        });
        return toExport;
    }

    const pendingDefaultOverrides = {} as Dictionary<any>;

    function overrideDefault(varName: string, newDefault: string) {
        const target = registeredEnvironmentVariables[varName];
        if (target) {
            target.default = newDefault;
        } else {
            pendingDefaultOverrides[varName] = newDefault;
        }
    }

    function normaliseArray<T>(arr: Optional<T | T[]>): T[] {
        if (!arr) {
            return [];
        }
        return Array.isArray(arr)
            ? arr
            : [ arr ];
    }

    function update(
        varName: string | keyof Env,
        fallbackValue?: string,
        help?: string | string[],
        tasks?: string | string[],
        overriddenBy?: string | string[],
        when?: OverrideWhen
    ) {
        const target = registeredEnvironmentVariables[varName];
        if (!target.help) {
            target.help = Array.isArray(help)
                ? trimAll(help)
                : trim(help);
        }
        if (!target.default) {
            target.default = trim(fallbackValue);
        }
        tasks = normaliseArray(tasks);
        target.tasks = normaliseArray(target.tasks).concat(tasks);
        target.overriddenBy = normaliseArray(target.overriddenBy)
            .concat(normaliseArray(overriddenBy));
        // TODO: composite when? this code is first-come-first-wins
        target.when = target.when || when;
        debug({
                  label: `update env var: ${ varName }`,
                  config: target
              });
        return toExport;
    }

    function trim(str: string | undefined | null): string {
        if (!str) {
            return "";
        }
        return `${ str }`.trim();
    }

    function trimAll(a: string[] | undefined | null): string[] {
        if (!a) {
            return [];
        }
        return a.map(s => `${ s }`.trim());
    }

    function printHelp() {
        const filter = (process.env.HELP_ENV_FILTER || "")
            .toLowerCase()
            .split(" ")
            .filter(s => !!s);
        printHelpFor(
            listVars()
                .filter(
                    k => !filter || filter.reduce(
                        (acc, cur) => acc && k.toLowerCase().indexOf(cur) > -1,
                        true
                    )
                )
        );
    }

    function printHelpFor(vars: string[]) {
        const longest = longestStringLength(vars);
        vars.forEach(k =>
                         createHelpFor(k, longest).forEach(line => console.log(line))
        );
    }

    function indent(str: string, howMany?: number) {
        if (howMany === undefined || howMany < 1) {
            howMany = 1;
        }
        return padLeft(str, howMany * 2 + str.length);
    }

    const tasksPre = chalk.greenBright("tasks"),
        defaultPre = chalk.cyanBright("default");

    function createHelpFor(k: string, longest: number) {
        if (longest === undefined) {
            // take a guess
            longest = 16;
        }
        const result = [];
        result.push(chalk.yellow(`${ padRight(k, longest) }`));
        const target = registeredEnvironmentVariables[k];
        if (target.help) {
            if (Array.isArray(target.help)) {
                result.push.apply(
                    result,
                    target.help.map(s => chalk.gray(s))
                );
            } else {
                result.push(indent(chalk.gray(target.help)));
            }
        }
        if (target.default) {
            result.push(indent(`${ defaultPre }: ${ target.default }`, 2));
        }
        if (target.tasks && target.tasks.length) {
            const tasks = normaliseArray(target.tasks);
            result.push(
                indent(
                    `${ tasksPre }: ${
                        tasks.map(t => t.trim())
                            .filter(t => t)
                            .sort()
                            .join(", ")
                    }`,
                    2
                )
            );
        }
        if (target.overriddenBy !== undefined) {
            const overrides = Array.isArray(target.overriddenBy)
                ? target.overriddenBy.join(",")
                : target.overriddenBy;
            if (overrides.trim()) {
                result.push(indent(chalk.magenta(`overridden by: ${ overrides }`)));
            }
        }
        return result;
    }

    function listVars(): string[] {
        return Object.keys(registeredEnvironmentVariables).sort();
    }

    function taskHelp(task: string) {
        const keys = listVars(),
            matchingRequest = keys.filter(cur => {
                const tasks = normaliseArray(registeredEnvironmentVariables[cur].tasks);
                return tasks.indexOf(task) > -1;
            });
        printHelpFor(matchingRequest);
    }

    function resolveRequired() {
        const args = Array.from(arguments);
        const result = (resolve as Function).apply(undefined, args);
        if (result === undefined || result === null || result === "") {
            const s = args.length === 1 ? "" : "s";
            throw new ZarroError(`unable to resolve env var${ s } ${ args }`);
        }
        return result;
    }

    function resolve(...args: string[]) {
        if (args.length === 0) {
            throw new ZarroError(`invalid operation: resolve(...) requires at least one env var name to resolve`);
        }
        const names = (
            // horrible hax: ts doesn't recognise the flatMap fallback import
            Array.from(arguments)
                .filter(a => !!a) as any
        ).flatMap((a: any) => `${ a }`);
        const result = resolveInternal(names);
        logResolved(names, result);
        return result;
    }

    function resolveObject<T>(...args: string[]): Optional<T> {
        const resolvedValue = resolve(...args);
        return resolvedValue
            ? tryParse<T>(resolvedValue, args)
            : undefined;
    }

    function tryParse<T>(json: string, name: string[]): Optional<T> {
        try {
            return JSON.parse(json) as T;
        } catch (e) {
            const varname = name.length === 1
                ? name[0]
                : `[ ${ name.join(", ") } ]`;
            throw new ZarroError(
                `Unable to parse environment variable "${ varname }":\n${ json }`
            );
        }
    }

    function resolveWithFallback(
        varName: string,
        fallback: string
    ) {
        return resolveInternal(varName, false, fallback);
    }

    function resolveFirst(
        names: string[],
        ignoreDefault: boolean
    ): Optional<string> {
        return names
            .reduce(
                (acc, cur) =>
                    acc === undefined
                        ? resolveInternal(cur, ignoreDefault)
                        : acc,
                undefined as Optional<string>
            );
    }

    function firstDefined(...args: Optional<string>[]) {
        for (const arg of args) {
            if (arg !== undefined) {
                return arg;
            }
        }
    }

    function resolveEnvOrFileContents(name: string): Optional<string> {
        if (process.env[name] !== undefined) {
            return process.env[name];
        }
        if (name.match(/PATH/) || name.match(/FILE/)) {
            // refuse to look in files when the variable looks like
            // a file name or a path to something
            return undefined;
        }
        const
            key = "ZARRO_ALLOW_FILE_RESOLUTIONS",
            raw = process.env[key],
            fileResolutionsAreEnabled = resolveAsBoolean(name, raw, true);
        if (!fileResolutionsAreEnabled) {
            return;
        }
        if (fileExistsSync(name)) {
            return (readTextFileSync(name) || "").trim();
        }
    }

    function resolveInternal(
        name: string | string[],
        ignoreDefault?: boolean,
        overrideDefault?: string
    ) {
        if (Array.isArray(name)) {
            // attempt to resolve the first defined variable
            const firstDefinedVar = resolveFirst(name, true);
            // if that doesn't work, get the first default value
            return firstDefinedVar === undefined
                ? resolveFirst(name, false)
                : firstDefinedVar;
        }

        const target = registeredEnvironmentVariables[name] || {},
            configuredOverrides = target.overriddenBy,
            overrides = configuredOverrides
                ? Array.isArray(configuredOverrides)
                    ? configuredOverrides
                    : [ configuredOverrides ]
                : [],
            overrideValues = overrides
                .map(s => resolveEnvOrFileContents(s))
                .filter(s => s !== undefined),
            envOrFileValue = resolveEnvOrFileContents(name),
            initialValue = (!ignoreDefault && envOrFileValue === undefined)
                ? firstDefined(overrideDefault, target.default)
                : envOrFileValue;
        if (overrideValues.length === 0) {
            return initialValue;
        }
        const when = target.when;
        if (when === undefined) {
            if (overrideValues.length > 1) {
                console.warn(
                    `multiple override values found for "${ name }" and no strategy for discriminating set; selecting the first`
                );
                debug({
                          when: target.when,
                          overrides,
                          overrideValues,
                          initialValue
                      });
            }
            return overrideValues[0];
        }

        const result = overrideValues.reduce((acc, cur) => {
            debug({
                      label: "invoke override discriminator",
                      when: target.when,
                      acc,
                      cur
                  });
            return when(acc, cur) ? cur : acc;
        }, initialValue);

        debug({
                  when: target.when,
                  overrides,
                  overrideValues,
                  initialValue,
                  envVar: name,
                  envValue: process.env[name],
              });

        return result;
    }

    function logResolved(name: string | string[], value: any) {
        debug(
            `resolved: ${ name } => ${ quoteString(value) }`
        );
    }

    function quoteString(val: any) {
        return typeof val === "string"
            ?
            `"${ val }"`

            : val;
    }

    function resolveArray(
        name: string | string[],
        delimiter?: string
    ): string[] {
        const
            value = resolveInternal(name) || "",
            valueArray = Array.isArray(value) ? value : explode(value, delimiter);
        logResolved(name, valueArray);
        return valueArray;
    }

    function resolveMergedArray(
        name: string | string[],
        delimiter?: string
    ): string[] {
        if (!Array.isArray(name)) {
            name = [ name ];
        }
        const result = [] as string[];
        for (const item of name) {
            const arr = resolveArray(item, delimiter);
            result.push.apply(result, arr);
        }
        return result;
    }

    function resolveNumber(name: string): number {
        const value = resolveInternal(name),
            asNumber = parseInt(value || "", 10);
        if (isNaN(asNumber)) {
            throw new ZarroError(
                `${ value } is not a valid numeric value for ${ name }`
            );
        }
        logResolved(name, asNumber);
        return asNumber;
    }

    const positiveFlags = [ "yes", "true", "1" ];
    const negativeFlags = [ "no", "false", "0" ];

    function resolveFlag(name: string) {
        const
            resolved = resolveInternal(name),
            value = (resolved === undefined ? "" : resolved).toLowerCase();
        return resolveAsBoolean(name, value);
    }

    function resolveAsBoolean(
        name: string,
        value?: string,
        fallback?: boolean
    ): boolean {
        if (value === undefined && fallback !== undefined) {
            return fallback;
        }
        if (positiveFlags.indexOf(value || "") > -1) {
            logResolved(name, true);
            return true;
        }
        if (negativeFlags.indexOf(value || "") > -1) {
            logResolved(name, false);
            return false;
        }
        if (value === undefined) {
            throw new ZarroError(
                `environment flag not set and no default registered: ${ name }`
            );
        } else {
            throw new ZarroError(
                `environmental flag not appropriately set: ${ name } (received: "${ value }")`
            );
        }
    }

    function explode(str: string, delimiter?: string): string[] {
        return str
            .split(delimiter || ",")
            .map(p => p.trim())
            .filter(p => !!p);
    }

    function resolveMap<T>(name: string | string[], fallback?: T, delimiter?: string): T {
        const raw = resolveInternal(name);
        if (!raw) {
            return fallback === undefined
                ? {} as T
                : fallback;
        }
        const trimmed = raw.trim();
        if (trimmed.startsWith("{")) {
            return JSON.parse(trimmed) as T;
        }
        const
            parts = explode(raw, delimiter),
            result = {} as Dictionary<string>;
        for (const part of parts) {
            const
                sub = part.split("="),
                key = sub[0],
                value = sub.slice(1).join("=");
            result[key] = value;
        }
        return result as unknown as T;
    }

    const registerEnvironmentVariables = require("./register-environment-variables");
    registerEnvironmentVariables(toExport);

    module.exports = toExport;
})();
