# Orden de trabajo — Endurecimiento de la IP pública 181.78.5.14

**Para:** Técnico de redes / proveedor de internet
**De:** Equipo digital — Travel World Colombia
**Fecha:** 2026-09-02 · **Prioridad:** ALTA (bloquea certificación PCI/ASV)

## Contexto

Un escaneo ASV externo (Outpost24, 2026-09-02, reporte `70285C54C62E38C8A69477CB26C0602E`) sobre la IP pública de la oficina **181.78.5.14** arrojó **3 hallazgos HIGH y 3 MEDIUM** (CVSS promedio 7.4). Todos corresponden a servicios de administración de la red local expuestos a internet — **no** al sitio web (que corre en Vercel, fuera de esta IP, y salió con 0 hallazgos).

**Objetivo:** que un re-escaneo desde internet no vea ningún servicio de gestión en esta IP. Todo puerto de administración debe quedar cerrado o filtrado hacia la WAN; el acceso remoto de gestión, solo por VPN o desde IPs de origen explícitas.

## Puertos detectados abiertos (todos desde internet)

| Puerto | Servicio | Evidencia del escáner |
|---|---|---|
| 22/TCP | SSH | banner detectado |
| 161/UDP | SNMP | responde a comunidad `public` |
| 2000/TCP | mikrotik-btest | bandwidth-test server de RouterOS habilitado |
| 8000/TCP | HTTP | `Server: Astra` (HTML de 348 KB — ¿IPTV/DVR/NVR?) |
| 8002/TCP | HTTP | `Embedthis-Appweb/3.4.2`, Basic auth realm "Webserver" |

## Hallazgos y acciones requeridas

### 1. CRÍTICO — Credenciales por defecto `admin/admin` en http://181.78.5.14:8002/
- **CVSS 3.0: 9.8 (Critical).** El escáner inició sesión con `admin/admin`. El servidor es Embedthis-Appweb 3.4.2 (típico de dispositivos embebidos: ONU/radio/DVR/antena).
- **Acción:** identificar el dispositivo detrás del port-forward :8002, cambiar la credencial por una fuerte y única y, sobre todo, **eliminar la publicación del puerto hacia la WAN**. Si ese equipo necesita gestión remota, que sea vía VPN — nunca expuesto directo.

### 2. HIGH — SNMP 161/UDP con comunidad `public` (CVE-1999-0516 / CVE-1999-0517)
- Permite leer (y potencialmente escribir) configuración del equipo desde internet. Los 3 hallazgos MEDIUM restantes (autenticación en claro, susceptibilidad a fuerza bruta, spoofing UDP) son consecuencia del mismo servicio.
- **Acción:** deshabilitar SNMP si no se usa para monitoreo. Si se usa: comunidad no adivinable, versión SNMPv3 con auth+priv, y ACL que limite el acceso a la IP del sistema de monitoreo — nunca abierto a 0.0.0.0/0. En cualquier caso, **bloquear 161/UDP desde la WAN**.

### 3. MikroTik: bandwidth-test abierto (2000/TCP)
- Permite a terceros usar el router para pruebas de ancho de banda (vector de DoS y de reconocimiento).
- **Acción:** `/tool bandwidth-server set enabled=no`

### 4. SSH (22/TCP) y HTTP "Astra" (8000/TCP) expuestos
- **SSH:** restringir a las IPs de gestión del proveedor (`/ip service set ssh address=<IPs>`) o mover detrás de VPN. Deshabilitar autenticación por contraseña si es viable (solo llaves).
- **:8000 "Astra":** identificar el servicio (parece software de streaming/IPTV o un DVR). Si no requiere acceso público, retirar el port-forward.

## Checklist sugerido para el RouterOS (MikroTik)

```
/user set [find name=admin] password="<contraseña fuerte>"        # o crear usuario propio y deshabilitar admin
/tool bandwidth-server set enabled=no
/snmp set enabled=no                                              # o SNMPv3 + ACL si se necesita monitoreo
/ip service disable telnet,ftp,www,api,api-ssl
/ip service set ssh address=<IPs de gestión>
/ip service set winbox address=192.168.0.0/16                     # solo LAN (ajustar al direccionamiento real)
/tool mac-server set allowed-interface-list=LAN
/tool mac-server mac-winbox set allowed-interface-list=LAN
/ip neighbor discovery-settings set discover-interface-list=LAN
```

- Revisar `/ip firewall nat` y **eliminar o restringir por `src-address` los dst-nat** que publican :8000 y :8002 hacia equipos internos.
- Regla de `input` en el firewall: drop todo lo entrante por WAN salvo `established/related` y la gestión permitida.
- Actualizar RouterOS al canal estable vigente (`/system package update install`) y luego `/system routerboard upgrade` — la versión actual no se pudo determinar desde fuera, pero conviene descartarse de CVEs conocidos de RouterOS.
- Cambiar también las credenciales de los dispositivos detrás de :8000 y :8002 aunque dejen de estar expuestos (defensa en profundidad).

## Precauciones

- Coordinar **ventana de trabajo**: cerrar servicios de gestión remota puede dejar al técnico sin acceso — hacerlo con acceso local al equipo o con la VPN ya probada.
- Para el **re-escaneo de certificación**: no crear reglas que bloqueen específicamente al escáner ASV (origen observado: `80.254.228.183`); el estándar exige escanear sin listas blancas hacia el escáner. La meta es que los puertos estén cerrados de verdad, no ocultos para el escáner.

## Criterio de aceptación

Desde una red externa:

```
nmap -Pn -sT -p 22,2000,8000,8002 181.78.5.14
nmap -Pn -sU -p 161 181.78.5.14
```

Resultado esperado: todos `filtered`/`closed` (o únicamente lo estrictamente acordado, con ACL por origen). Después solicitamos el re-escaneo ASV para cerrar la certificación.

---
*Referencia completa: reporte "Vulnerability Detailed Report — TRAVEL WORD" (Outpost24), intervalo 2026-09-02 11:38–12:03 UTC. Lo adjuntamos si lo necesitan.*
