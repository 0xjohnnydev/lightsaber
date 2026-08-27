# LightSaber

**[0xjohnnydev.github.io/lightsaber](https://0xjohnnydev.github.io/lightsaber/)**

> ## ⚠ LightSaber is moving to [Cyanide](https://github.com/0xjohnnydev/cyanide)
>
> Cyanide is built on a full kernel exploit instead of this WebKit + sandbox-escape chain — no Safari freezes, no failed retries, no kernel panics from a flaky userland exploit. The same tweaks install in one shot from a signed app and persist until respring/reboot. Use LightSaber only if your device can't run Cyanide.

iOS 18.4 - 18.6.2 userland exploit chain with JavaScript injection that modifies SpringBoard and other system processes at runtime, derived from [DarkSword](https://iverify.io/blog/darksword-ios-exploit-kit-explained) with all malware communication stripped. This is runtime JS modification through an exploit chain, not dylib injection like a full jailbreak — changes persist until respring or reboot.

## Supported devices

Every arm64e iPhone (A12 - A18 Pro) running iOS 18.4 - 18.6.2.

## How it works

LightSaber chains a WebContent RCE into kernel R/W via sandbox escape, then uses a JSC + `objc_msgSend` / `dlsym` native bridge to inject JavaScript into other processes (SpringBoard, mediaplaybackd, thermalmonitord, etc.).

### Chain stages

| Stage | Where | What |
|---|---|---|
| `index.html` | Safari main page | Install card UI, tweak picker, gating |
| `rce_loader.js` | WebContent iframe | URL parser, postMessage routing, exploit bootstrap |
| `rce_worker*.js` | WebContent worker | JavaScriptCore exploit, addrof/fakeobj/read64/write64 primitives |
| `rce_module*.js` | WebContent worker | Heap shaping, PAC gadget signing |
| `sbx0_main_18.4.js` | WebContent worker | Sandbox escape |
| `sbx1_main.js` | mediaplaybackd | Prelude builder, kernel R/W, process injection bridge |
| `pe_main.js` | mediaplaybackd | Payload dispatch, `inject*Payload` helpers |
| `*_light.js` | Target processes | Tweak payloads (run via the native bridge) |

## Available tweaks

- **SBCustomizer** — runtime SpringBoard layout customization: dock icon count, home screen columns and rows, hide icon labels. Patched once during chain execution.
- **Powercuff** — port of [rpetrich's Powercuff](https://github.com/rpetrich/Powercuff). Underclocks CPU/GPU via thermalmonitord for extended battery life. Four levels: nominal, light, moderate, heavy. Lasts until reboot.

## Usage

Visit [0xjohnnydev.github.io/lightsaber](https://0xjohnnydev.github.io/lightsaber/) in Safari on a supported device. Pick your tweaks, tap **Install Selected**, and keep Safari in the foreground for up to 60 seconds while the chain runs.

**If it fails** (page flash, "A problem repeatedly occurred", or "webpage crashed" banner): clear Safari's cache (book icon > Clear), reload, and retry. If it keeps failing, reboot, clear cache again, and try once more.

## Debugging with syslog.py

`syslog.py` is a filtered device syslog viewer that shows only chain-relevant log lines. Requires a Mac with `idevicesyslog` installed (`brew install libimobiledevice`) and the device connected via USB.

```bash
python3 syslog.py
```

Each run creates a timestamped log file in `logs/` (e.g. `logs/syslog_2026-04-09_15-37-00.txt`). Log tags are color-coded:

- **Green** `[PE]` `[PE-DBG]` - post-exploit / kernel phase
- **Magenta** `[SBX1]` `SBX0` - sandbox escape stages
- **Cyan** `[SBC]` `[POWERCUFF]` `[MG]` `[APPLIMIT]` `[THREEAPP]` - tweak payloads
- **Red** - crashes, PAC violations, JS errors

See [`logs/example_successful_run.txt`](logs/example_successful_run.txt) for what a successful chain run looks like.

## Project structure

```
index.html              Main install page (Safari UI)
frame.html              Exploit iframe shell
rce_loader.js           Iframe-side bootstrap + postMessage router
rce_worker.js           WebContent worker (iOS 18.4)
rce_worker_18.6.js      WebContent worker (iOS 18.5-18.6.2)
rce_module.js           Heap shaping module (18.4)
rce_module_18.6.js      Heap shaping module (18.5-18.6.2)
sbx0_main_18.4.js       Sandbox escape
sbx1_main.js            Kernel R/W + process injection bridge
pe_main.js              Payload dispatch in mediaplaybackd
powercuff_light.js      Powercuff payload
sbcustomizer_light.js   SBCustomizer payload
colorbanners_light.js   ColorBanners payload (WIP)
syslog.py               Device syslog capture helper
respring.html           Resprings your device without an exploit
```

## Credits

- [iVerify](https://iverify.io/blog/darksword-ios-exploit-kit-explained) & [Google GTIG](https://cloud.google.com/blog/topics/threat-intelligence/darksword-ios-exploit-chain) — DarkSword chain documentation
- [leminlimez](https://github.com/leminlimez/Nugget) — Nugget (MobileGestalt + BookRestore)
- [khanhduytran0](https://github.com/khanhduytran0/SparseBox) — SparseBox (3-app limit bypass)
- [rpetrich](https://github.com/rpetrich/Powercuff) — Powercuff tweak
- [34306](https://github.com/34306) & [khanhduytran0](https://github.com/khanhduytran0) — [site design](http://34306.lol/darksword/) reference
- [@cro4js](https://twitter.com/cro4js) — UI suggestions
- [neonmodder123](https://github.com/neonmodder123) — Respring Method

## License

MIT License. See [LICENSE](LICENSE) for details.
