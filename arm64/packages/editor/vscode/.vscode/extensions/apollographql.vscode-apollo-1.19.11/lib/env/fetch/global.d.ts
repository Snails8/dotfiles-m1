declare function fetch(input?: RequestInfo, init?: RequestInit): Promise<Response>;
declare interface GlobalFetch {
    fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}
declare interface WindowOrWorkerGlobalScope {
    fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}
declare type RequestInfo = import("./fetch").RequestInfo;
declare type Headers = import("./fetch").Headers;
declare type HeadersInit = import("./fetch").HeadersInit;
declare type Body = import("./fetch").Body;
declare type Request = import("./fetch").Request;
declare type RequestAgent = import("./fetch").RequestAgent;
declare type RequestInit = import("./fetch").RequestInit;
declare type RequestMode = import("./fetch").RequestMode;
declare type RequestCredentials = import("./fetch").RequestCredentials;
declare type RequestCache = import("./fetch").RequestCache;
declare type RequestRedirect = import("./fetch").RequestRedirect;
declare type ReferrerPolicy = import("./fetch").ReferrerPolicy;
declare type Response = import("./fetch").Response;
declare type ResponseInit = import("./fetch").ResponseInit;
declare type BodyInit = import("./fetch").BodyInit;
declare type URLSearchParams = import("./url").URLSearchParams;
declare type URLSearchParamsInit = import("./url").URLSearchParamsInit;
//# sourceMappingURL=global.d.ts.map