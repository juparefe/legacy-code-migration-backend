import createDebug from "debug";

export const debugHttp = createDebug("app:http");
export const debugService = createDebug("app:service");
export const debugRules = createDebug("app:rules");
export const debugError = createDebug("app:error");