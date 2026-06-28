# xquant.us VM — VPN Gateway Notes

> The `xquant.us` VM has **two roles** on one box:
> 1. The **website** (Next.js, what this repo deploys).
> 2. A personal **Xray VLESS-REALITY gateway** to bypass the Chinese Great Firewall (GFW).
>
> This note documents role #2. It has nothing to do with the website code, but it
> lives on the same server, so it's recorded here so the setup isn't forgotten.

## Server

- Host: `vpn.xquant.us` → **`172.235.202.56`** (Linode)
- SSH: `ssh xquant` (alias in `~/.ssh/config`, user `root`)
- Xray runs as a systemd service: `systemctl {status,restart} xray`
  - config: `/usr/local/etc/xray/config.json`
  - timestamped backups: `/usr/local/etc/xray/config.json.*`

### How the box shares port 443 between website and VPN
`nginx` owns public `:443` and routes by TLS SNI (nginx `stream` block, `ssl_preread`):

| Incoming SNI                     | Routed to                                   |
|----------------------------------|---------------------------------------------|
| `xquant.us`, `www.xquant.us`     | nginx website backend `127.0.0.1:8444` → Next.js `:3000` |
| anything else (`www.apple.com`)  | **Xray REALITY** inbound `127.0.0.1:1443`   |

There's also a separate legacy VLESS-TLS inbound on public `:8443` (different UUID, unused by the main client).

### REALITY parameters (client-side values, needed to rebuild any client)
- address/port: `172.235.202.56:443`
- id (UUID): `71f51ee0-069d-4cfe-ba9c-9c06cfdbb9e9`
- flow: `xtls-rprx-vision`
- security: `reality`, fingerprint `chrome`
- **serverName / SNI: `www.apple.com`**  ← see incident note below
- publicKey: `TGY-xsNJrZ1Zy40TUAM1zXkC5iY2hNcQ9-dO7oXgCXw`
- shortId: `2485f476df9e712c`

> The server **privateKey** is a secret and lives only in the server config — not copied here.

---

## MacBook Air (this computer)

### 1. Start the local Xray client
Xray runs locally and exposes proxy ports `127.0.0.1:1080` (SOCKS5) and `127.0.0.1:1081` (HTTP).

```sh
brew services start xray        # start (also: restart / stop / list)
```
- config: `/opt/homebrew/etc/xray/config.json`

### 2a. For Chrome / GUI apps — system SOCKS proxy
System Settings → Wi-Fi → Details → **Proxies → SOCKS proxy = ON**, server `127.0.0.1`, port `1080`.
Or from the terminal:
```sh
networksetup -setsocksfirewallproxy      "Wi-Fi" 127.0.0.1 1080
networksetup -setsocksfirewallproxystate "Wi-Fi" on      # off to disable
networksetup -getsocksfirewallproxy      "Wi-Fi"         # check state
```

### 2b. For the terminal / CLI tools — env-var toggles
Defined as zsh functions in `~/.zshrc` (these set `ALL_PROXY`/`HTTP(S)_PROXY`, they do **not** touch the system/Chrome proxy):

```sh
proxy-on       # export ALL_PROXY=socks5h://127.0.0.1:1080, HTTP(S)_PROXY=127.0.0.1:1081
proxy-off      # unset them
proxy-status   # show state + current egress IP (via ipinfo.io)
```

> These are the commands previously misremembered as `vpn-up` / `vpn-down`.

### Typical "turn the VPN on" sequence
```sh
brew services start xray   # once per boot
proxy-on                   # for this terminal
# and/or flip the Wi-Fi SOCKS toggle ON for Chrome
proxy-status               # confirm egress IP == 172.235.202.56
```

---

## Android phone

- App: **v2rayNG**
- Same REALITY parameters as above; **serverName = `www.apple.com`**.

---

## Incident & fixes — 2026-06-27

Both the Mac and the phone lost internet through the proxy. Two independent problems:

1. **REALITY `dest` was `www.microsoft.com`.** Microsoft's TLS cert chain grew past Xray's
   **hardcoded 8192-byte limit** ([Xray-core #6356](https://github.com/XTLS/Xray-core/issues/6356)),
   so every authorized handshake failed (server log: `REALITY: processed invalid connection …
   handshake did not complete successfully`). The keys/UUID/shortId were never wrong.
   **Fix:** changed server `dest`/`serverNames` and every client `serverName` from
   `www.microsoft.com` → **`www.apple.com`** (any small-cert site works; verify with
   `openssl s_client -showcerts -connect host:443`).

2. **Path MTU < 1500** on the home network silently dropped large packets (PMTUD ICMP blocked),
   so large transfers stalled. **Fix:** a bidirectional MSS clamp on the server (covers all
   devices, no per-device change):
   ```sh
   iptables -t mangle -A PREROUTING  -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1340
   iptables -t mangle -A POSTROUTING -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --set-mss 1340
   ```
   Persisted via `/etc/iptables/rules.v4` + `iptables-restore.service` (systemd, enabled on boot).

### Debugging recipe (if it breaks again)
- Server: set xray `loglevel` to `debug`, then `journalctl -u xray -f`.
- Test REALITY while bypassing nginx and the public network path:
  `ssh -L 11443:127.0.0.1:1443 xquant`, then point a local xray client at `127.0.0.1:11443`.
- `handshake did not complete successfully` while a plain `curl` fallback through the same
  server still works ⇒ suspect the `dest` cert-size bug (#1 above).
